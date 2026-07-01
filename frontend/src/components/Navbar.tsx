import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <nav className="bg-indigo-600 text-white shadow px-6 py-4 flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <span className="text-xl font-black tracking-wide">📚 VGN CHINMAYA LIBRARY</span>
      </div>
      <div className="space-x-4 flex items-center">
        {user ? (
          <>
            <span className="text-sm bg-indigo-700 px-3 py-1 rounded-full text-indigo-100 font-medium">🧑‍💻 {user.name}</span>
            <button onClick={() => { logout(); navigate('/login'); }} className="bg-red-500 hover:bg-red-600 font-bold px-4 py-2 text-xs rounded transition">Sign Out</button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:text-indigo-200 text-sm font-medium">Login</Link>
            <Link to="/register" className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold text-sm px-4 py-2 rounded shadow transition">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}