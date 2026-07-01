import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function initDB() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role VARCHAR(50) CHECK(role IN ('user', 'librarian')) NOT NULL,
        status VARCHAR(50) DEFAULT 'active'
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS books (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL,
        genre VARCHAR(100) NOT NULL,
        isbn VARCHAR(100) UNIQUE NOT NULL,
        total_copies INTEGER NOT NULL,
        available_copies INTEGER NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS loans (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        book_id INTEGER NOT NULL REFERENCES books(id),
        borrow_date DATE NOT NULL,
        due_date DATE NOT NULL,
        return_date DATE,
        fine_amount DECIMAL(10, 2) DEFAULT 0.0,
        status VARCHAR(50) CHECK(status IN ('borrowed', 'returned', 'overdue')) DEFAULT 'borrowed'
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS reservations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        book_id INTEGER NOT NULL REFERENCES books(id),
        reserved_date DATE NOT NULL,
        status VARCHAR(50) CHECK(status IN ('pending', 'fulfilled', 'cancelled')) DEFAULT 'pending'
      )
    `);

    const { rows: adminCheck } = await client.query("SELECT * FROM users WHERE email = 'librarian@library.com'");
    if (adminCheck.length === 0) {
      const hashedPwd = await bcrypt.hash('admin123', 10);
      await client.query(
        "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'librarian')",
        ['Head Librarian', 'librarian@library.com', hashedPwd]
      );
      
      await client.query("INSERT INTO books (title, author, genre, isbn, total_copies, available_copies) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (isbn) DO NOTHING", 
        ['The TypeScript Handbook', 'Boris Cherny', 'Technology', '978-1492037651', 5, 5]);
      await client.query("INSERT INTO books (title, author, genre, isbn, total_copies, available_copies) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (isbn) DO NOTHING", 
        ['Clean Code', 'Robert C. Martin', 'Technology', '978-0132350884', 2, 2]);
    }

    await client.query('COMMIT');
    console.log("🚀 Cloud PostgreSQL Database synchronized successfully.");
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ Database initialization failed:", err);
  } finally {
    client.release();
  }
}

export default pool;