import React, { useEffect, useState } from 'react';

export default function UserDashboard() {
  const [books, setBooks] = useState([]);
  const [dashboardData, setDashboardData] = useState<any>({ activeLoans: [], reservations: [] });
  const [search, setSearch] = useState('');
  const token = localStorage.getItem('library_token');

  const fetchData = async () => {
    const headers = { 'Authorization': `Bearer ${token}` };
    const [resBooks, resDash] = await Promise.all([
      fetch('https://vgn-library-system.onrender.com/api/books', { headers }),
      fetch('https://vgn-library-system.onrender.com/api/users/dashboard', { headers })
    ]);
    if (resBooks.ok && resDash.ok) {
      setBooks(await resBooks.json());
      setDashboardData(await resDash.json());
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleBorrow = async (bookId: number) => {
    const res = await fetch('https://vgn-library-system.onrender.com/api/books/borrow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ book_id: bookId })
    });
    const data = await res.json();
    alert(data.message);
    fetchData();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-xl font-black text-slate-800">Book Catalog</h2>
        <input type="text" placeholder="🔍 Search books by title or author..." className="w-full border p-3 rounded-xl shadow-sm bg-white outline-none" onChange={e => setSearch(e.target.value)} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {books.filter((b: any) => b.title.toLowerCase().includes(search.toLowerCase())).map((book: any) => (
            <div key={book.id} className="bg-white p-5 rounded-xl border shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-indigo-500 uppercase">{book.genre}</span>
                <h3 className="font-bold text-slate-800 text-base mt-1">{book.title}</h3>
                <p className="text-xs text-slate-500">by {book.author}</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className={`text-xs font-bold ${book.available_copies > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {book.available_copies > 0 ? `${book.available_copies} Available` : 'Queue Active'}
                </span>
                <button onClick={() => handleBorrow(book.id)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-sm">
                  {book.available_copies > 0 ? 'Borrow' : 'Reserve'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="text-xs font-black uppercase text-indigo-600 mb-3 tracking-wider">Your Borrowed Books</h3>
          {dashboardData.activeLoans.length === 0 ? <p className="text-xs text-slate-400">No books checked out.</p> : (
            <div className="space-y-2">
              {dashboardData.activeLoans.map((loan: any) => (
                <div key={loan.id} className="p-3 bg-slate-50 rounded-lg text-xs border">
                  <p className="font-bold text-slate-700">{loan.title}</p>
                  <p className="text-red-500 font-medium">Due date: {new Date(loan.due_date).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
