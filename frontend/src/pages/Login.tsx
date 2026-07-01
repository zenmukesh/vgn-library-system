import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../App';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('https://vgn-library-system-1.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        login(data.user, data.token);
        navigate(data.user.role === 'librarian' ? '/librarian' : '/dashboard');
      } else {
        setError(data.error);
      }
    } catch {
      setError('Cannot reach server. Is backend running?');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white p-8 rounded-xl shadow border border-slate-100">
      <h2 className="text-2xl font-black text-slate-800 text-center mb-6">Portal Log In</h2>
      {error && <div className="p-3 mb-4 text-xs bg-red-50 text-red-600 rounded font-semibold">{error}</div>}
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
          <input className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" type="email" placeholder="librarian@library.com or your email" required onChange={e => setForm({...form, email: e.target.value})} />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
          <input className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" type="password" placeholder="••••••••" required onChange={e => setForm({...form, password: e.target.value})} />
        </div>
        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg font-bold shadow transition">Login</button>
      </form>
      <p className="text-xs text-center text-slate-500 mt-4">Need an account? <Link to="/register" className="text-indigo-600 font-bold hover:underline">Register here</Link></p>
    </div>
  );
}
