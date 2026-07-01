import React, { createContext, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import LibrarianDashboard from './pages/LibrarianDashboard';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/Protected';

export const AuthContext = createContext<any>(null);

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('library_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (userData: any, token: string) => {
    localStorage.setItem('library_token', token);
    localStorage.setItem('library_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('library_token');
    localStorage.removeItem('library_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <Router>
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
          <Navbar />
          <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
            <Routes>
              <Route path="/login" element={!user ? <Login /> : <Navigate to={user.role === 'librarian' ? '/librarian' : '/dashboard'} />} />
              <Route path="/register" element={!user ? <Register /> : <Navigate to={user.role === 'librarian' ? '/librarian' : '/dashboard'} />} />
              <Route path="/dashboard" element={<ProtectedRoute allowedRole="user"><UserDashboard /></ProtectedRoute>} />
              <Route path="/librarian" element={<ProtectedRoute allowedRole="librarian"><LibrarianDashboard /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}