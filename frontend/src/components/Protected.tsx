import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../App';

export default function ProtectedRoute({ children, allowedRole }: { children: JSX.Element, allowedRole: 'user' | 'librarian' }) {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== allowedRole) return <Navigate to={user.role === 'librarian' ? '/librarian' : '/dashboard'} replace />;
  return children;
}