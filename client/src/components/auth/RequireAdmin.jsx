import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export function RequireAdmin() {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/403" replace />;
  return <Outlet />;
}
