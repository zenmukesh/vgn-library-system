import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user', secretKey: '', grade: '', section: '' });
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('https://vgn-library-system-1.onrender.com/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form) 
    });
    const data = await res.json();
    if (res.ok) {
      setMsg('Account setup ready! Redirecting...');
      setTimeout(() => navigate('/login'), 1500);
    } else {
      setMsg(data.error);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-xl shadow border border-slate-100">
      <h2 className="text-2xl font-black text-slate-800 text-center mb-6">Create Account</h2>
      {msg && <div className="p-3 mb-4 text-xs bg-indigo-50 rounded text-indigo-700 font-medium">{msg}</div>}
      <form onSubmit={handleRegister} className="space-y-4">
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
          <button type="button" onClick={() => setForm({...form, role: 'user', secretKey: ''})} className={`py-2 text-xs font-bold rounded-md transition ${form.role === 'user' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>🧑‍🎓 Student / User</button>
          <button type="button" onClick={() => setForm({...form, role: 'librarian', grade: '', section: ''})} className={`py-2 text-xs font-bold rounded-md transition ${form.role === 'librarian' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>🔑 Librarian</button>
        </div>
        
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
          <input className="w-full border p-3 rounded-lg outline-none" type="text" placeholder="Full Name" required onChange={e => setForm({...form, name: e.target.value})} />
        </div>

        {form.role === 'user' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Standard</label>
              <select 
                className="w-full border p-3 rounded-lg outline-none bg-white"
                onChange={e => setForm({...form, grade: e.target.value ? parseInt(e.target.value) : ''})}
                required
              >
                <option value="">Select...</option>
                <option value="1">1st Std</option>
                <option value="2">2nd Std</option>
                <option value="3">3rd Std</option>
                <option value="4">4th Std</option>
                <option value="5">5th Std</option>
                <option value="6">6th Std</option>
                <option value="7">7th Std</option>
                <option value="8">8th Std</option>
                <option value="9">9th Std</option>
                <option value="10">10th Std</option>
                <option value="11">11th Std</option>
                <option value="12">12th Std</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Section</label>
              <select 
                className="w-full border p-3 rounded-lg outline-none bg-white"
                onChange={e => setForm({...form, section: e.target.value})}
                required
              >
                <option value="">Select...</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
          <input className="w-full border p-3 rounded-lg outline-none" type="email" placeholder="email@domain.com" required onChange={e => setForm({...form, email: e.target.value})} />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
          <input className="w-full border p-3 rounded-lg outline-none" type="password" placeholder="••••••••" required onChange={e => setForm({...form, password: e.target.value})} />
        </div>

        {form.role === 'librarian' && (
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Librarian Passcode</label>
            <input 
              className="w-full border-2 border-indigo-200 p-3 rounded-lg outline-none focus:border-indigo-500 transition" 
              type="password" 
              placeholder="Enter secret passcode" 
              required 
              onChange={e => setForm({...form, secretKey: e.target.value})} 
            />
          </div>
        )}

        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg font-bold shadow transition">Sign Up</button>
      </form>
    </div>
  );
}
