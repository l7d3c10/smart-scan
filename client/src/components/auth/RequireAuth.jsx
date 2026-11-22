import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="auth-loading" role="status">Đang kiểm tra phiên đăng nhập…</div>;
  }
  if (!user) return <Navigate to="/dang-nhap" replace state={{ from: location }} />;
  return children || <Outlet />;
}
