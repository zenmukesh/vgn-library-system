import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pool, { initDB } from './database';
import { authenticateToken, requireRole, AuthRequest } from './middleware';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'vgn-chinmaya-secret-key';

initDB();

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const hashedPwd = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id",
      [name, email, hashedPwd, role]
    );
    res.status(201).json({ message: 'User registered successfully', userId: result.rows[0].id });
  } catch (err: any) {
    res.status(400).json({ error: 'Email already exists or invalid data' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = rows[0];
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/books', authenticateToken, async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM books ORDER BY title ASC");
  res.json(rows);
});

app.post('/api/books/borrow', authenticateToken, requireRole('user'), async (req: AuthRequest, res) => {
  const { book_id } = req.body;
  const user_id = req.user!.id;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const { rows: bookRows } = await client.query("SELECT * FROM books WHERE id = $1 FOR UPDATE", [book_id]);
    const book = bookRows[0];

    if (!book) throw new Error('Book not found');

    if (book.available_copies <= 0) {
      await client.query(
        "INSERT INTO reservations (user_id, book_id, reserved_date) VALUES ($1, $2, CURRENT_DATE)",
        [user_id, book_id]
      );
      await client.query('COMMIT');
      return res.json({ status: 'reserved', message: 'Book out of stock. Placed in reservation queue.' });
    }

    await client.query("UPDATE books SET available_copies = available_copies - 1 WHERE id = $1", [book_id]);
    await client.query(
      "INSERT INTO loans (user_id, book_id, borrow_date, due_date, status) VALUES ($1, $2, CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days', 'borrowed')",
      [user_id, book_id]
    );

    await client.query('COMMIT');
    res.json({ status: 'borrowed', message: 'Book checked out successfully!' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Transaction failed' });
  } finally {
    client.release();
  }
});

app.get('/api/users/dashboard', authenticateToken, requireRole('user'), async (req: AuthRequest, res) => {
  const user_id = req.user!.id;
  
  const { rows: activeLoans } = await pool.query(`
    SELECT loans.*, books.title, books.author FROM loans 
    JOIN books ON loans.book_id = books.id 
    WHERE loans.user_id = $1 AND loans.status != 'returned'
  `, [user_id]);

  const { rows: reservations } = await pool.query(`
    SELECT reservations.*, books.title FROM reservations
    JOIN books ON reservations.book_id = books.id
    WHERE reservations.user_id = $1 AND reservations.status = 'pending'
  `, [user_id]);

  res.json({ activeLoans, reservations });
});

app.get('/api/librarian/stats', authenticateToken, requireRole('librarian'), async (req, res) => {
  const { rows: bookSum } = await pool.query("SELECT SUM(total_copies) as total FROM books");
  const { rows: activeLoansCount } = await pool.query("SELECT COUNT(*) as count FROM loans WHERE status != 'returned'");
  const { rows: queueCount } = await pool.query("SELECT COUNT(*) as count FROM reservations WHERE status = 'pending'");
  const { rows: allLoans } = await pool.query(`
    SELECT loans.*, users.name as user_name, books.title as book_title FROM loans
    JOIN users ON loans.user_id = users.id JOIN books ON loans.book_id = books.id ORDER BY loans.id DESC
  `);

  res.json({
    stats: {
      totalBooks: bookSum[0].total || 0,
      activeLoans: activeLoansCount[0].count || 0,
      pendingReservations: queueCount[0].count || 0
    },
    allLoans
  });
});

app.post('/api/books/bulk', authenticateToken, requireRole('librarian'), async (req, res) => {
  const { books } = req.body;
  if (!Array.isArray(books) || books.length === 0) return res.status(400).json({ error: 'Invalid data' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const book of books) {
      await client.query(
        "INSERT INTO books (title, author, genre, isbn, total_copies, available_copies) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (isbn) DO NOTHING",
        [book.title, book.author, book.genre, book.isbn, book.total_copies, book.total_copies]
      );
    }
    await client.query('COMMIT');
    res.json({ message: `Successfully uploaded ${books.length} books.` });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Bulk insertion failed.' });
  } finally {
    client.release();
  }
});

app.post('/api/librarian/return', authenticateToken, requireRole('librarian'), async (req, res) => {
  const { loan_id } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    
    const { rows: loanRows } = await client.query("SELECT * FROM loans WHERE id = $1", [loan_id]);
    const loan = loanRows[0];
    if (!loan) throw new Error('Loan not found');

    await client.query("UPDATE loans SET status = 'returned', return_date = CURRENT_DATE WHERE id = $1", [loan_id]);
    await client.query("UPDATE books SET available_copies = available_copies + 1 WHERE id = $1", [loan.book_id]);

    const { rows: queueRows } = await client.query("SELECT * FROM reservations WHERE book_id = $1 AND status = 'pending' ORDER BY id ASC LIMIT 1", [loan.book_id]);
    const nextReservation = queueRows[0];

    if (nextReservation) {
      await client.query("UPDATE reservations SET status = 'fulfilled' WHERE id = $1", [nextReservation.id]);
      await client.query(
        "INSERT INTO loans (user_id, book_id, borrow_date, due_date, status) VALUES ($1, $2, CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days', 'borrowed')",
        [nextReservation.user_id, loan.book_id]
      );
      await client.query("UPDATE books SET available_copies = available_copies - 1 WHERE id = $1", [loan.book_id]);
    }

    await client.query('COMMIT');
    res.json({ message: 'Return logged and next waitlisted user assigned.' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to process return.' });
  } finally {
    client.release();
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`📡 Cloud Server running smoothly on port ${PORT}`));