import React, { useEffect, useState } from 'react';

export default function LibrarianDashboard() {
  const [data, setData] = useState<any>({ stats: {}, allLoans: [] });
  const [bulkBooks, setBulkBooks] = useState([{ title: '', author: '', genre: '', isbn: '', total_copies: 1 }]);
  const token = localStorage.getItem('library_token');

  const fetchStats = async () => {
    const res = await fetch('http://localhost:5000/api/librarian/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) setData(await res.json());
  };

  useEffect(() => { fetchStats(); }, []);

  const handleBulkChange = (index: number, field: string, value: any) => {
    const updated = [...bulkBooks];
    (updated[index] as any)[field] = value;
    setBulkBooks(updated);
  };

  const submitBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/books/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ books: bulkBooks })
    });
    if (res.ok) {
      alert('Books uploaded successfully to Cloud PostgreSQL!');
      setBulkBooks([{ title: '', author: '', genre: '', isbn: '', total_copies: 1 }]);
      fetchStats();
    }
  };

  const handleReturn = async (loanId: number) => {
    const res = await fetch('http://localhost:5000/api/librarian/return', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ loan_id: loanId })
    });
    if (res.ok) {
      alert('Return updated!');
      fetchStats();
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border shadow-sm text-center">
          <p className="text-xs text-slate-400 font-bold uppercase">Total Inventory</p>
          <p className="text-2xl font-black text-indigo-600 mt-1">{data.stats.totalBooks || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm text-center">
          <p className="text-xs text-slate-400 font-bold uppercase">Active Loans</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{data.stats.activeLoans || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm text-center">
          <p className="text-xs text-slate-400 font-bold uppercase">Waitlist Requests</p>
          <p className="text-2xl font-black text-amber-500 mt-1">{data.stats.pendingReservations || 0}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800 text-lg">Librarian Tool: Add Multiple Books At Once</h3>
          <button onClick={() => setBulkBooks([...bulkBooks, { title: '', author: '', genre: '', isbn: '', total_copies: 1 }])} className="bg-indigo-50 text-indigo-600 font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition">Add Another Row</button>
        </div>
        <form onSubmit={submitBulk} className="space-y-3">
          {bulkBooks.map((b, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-5 gap-2 bg-slate-50 p-3 rounded-lg border">
              <input type="text" placeholder="Title" required className="border p-2 rounded text-xs outline-none" value={b.title} onChange={e => handleBulkChange(i, 'title', e.target.value)} />
              <input type="text" placeholder="Author" required className="border p-2 rounded text-xs outline-none" value={b.author} onChange={e => handleBulkChange(i, 'author', e.target.value)} />
              <input type="text" placeholder="Genre" required className="border p-2 rounded text-xs outline-none" value={b.genre} onChange={e => handleBulkChange(i, 'genre', e.target.value)} />
              <input type="text" placeholder="ISBN" required className="border p-2 rounded text-xs outline-none" value={b.isbn} onChange={e => handleBulkChange(i, 'isbn', e.target.value)} />
              <input type="number" min="1" required className="border p-2 rounded text-xs outline-none" value={b.total_copies} onChange={e => handleBulkChange(i, 'total_copies', parseInt(e.target.value))} />
            </div>
          ))}
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg font-bold text-xs transition shadow">Save All Additions</button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h3 className="font-bold text-slate-800 text-lg mb-4">Book Circulation Tracking Logs</h3>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b font-bold text-slate-400 uppercase">
              <th className="p-3">Borrower</th>
              <th className="p-3">Book</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.allLoans?.map((loan: any) => (
              <tr key={loan.id} className="border-b">
                <td className="p-3 font-medium text-slate-700">{loan.user_name}</td>
                <td className="p-3 text-slate-600">{loan.book_title}</td>
                <td className="p-3 uppercase font-bold text-[10px] text-emerald-600">{loan.status}</td>
                <td className="p-3 text-right">
                  {loan.status === 'borrowed' && (
                    <button onClick={() => handleReturn(loan.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded text-[11px] transition">Return</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}