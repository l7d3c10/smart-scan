import { useLocation } from 'react-router-dom';
import { ChevronRight, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const BREADCRUMB_MAP = {
  '/':              ['Tổng quan'],
  '/tai-lieu':      ['Tài liệu'],
  '/tai-lieu/them': ['Tài liệu', 'Thêm mới'],
};

function getBreadcrumbs(pathname) {
  if (BREADCRUMB_MAP[pathname]) return BREADCRUMB_MAP[pathname];
  if (/^\/tai-lieu\/\d+\/sua$/.test(pathname)) return ['Tài liệu', 'Chỉnh sửa'];
  if (/^\/tai-lieu\/\d+$/.test(pathname))      return ['Tài liệu', 'Chi tiết'];
  return [];
}

export function Topbar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const crumbs = getBreadcrumbs(pathname);

  async function handleLogout() {
    try {
      await logout();
      navigate('/dang-nhap', { replace: true });
    } catch {
      navigate('/dang-nhap', { replace: true });
    }
  }

  return (
    <header className="topbar">
      <nav className="topbar-breadcrumb" aria-label="Điều hướng vị trí">
        {crumbs.map((crumb, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            {i > 0 && <ChevronRight size={14} color="var(--color-gray-300)" />}
            <span className={i === crumbs.length - 1 ? 'topbar-breadcrumb-current' : ''}>
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      <div className="topbar-right">
        <div className="topbar-user">
          <span className="topbar-user-name">{user?.username}</span>
          <span className="badge badge-primary">{user?.role === 'admin' ? 'Admin' : 'User'}</span>
        </div>
        <button className="btn btn-ghost btn-sm" type="button" onClick={handleLogout}><LogOut size={15} /> Đăng xuất</button>
      </div>
    </header>
  );
}
