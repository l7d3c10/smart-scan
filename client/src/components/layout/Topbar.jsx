import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, LogOut, Sun, Moon, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const BREADCRUMB_MAP = {
  '/':                   ['Tổng quan'],
  '/tai-lieu':           ['Tài liệu'],
  '/tai-lieu/them':      ['Tài liệu', 'Thêm mới'],
  '/tai-lieu/nhap':      ['Tài liệu', 'Nhập dữ liệu'],
  '/tai-len':            ['Tải lên ảnh'],
  '/ho-so':              ['Hồ sơ cá nhân'],
  '/quan-tri/nguoi-dung':['Quản trị', 'Người dùng'],
  '/quan-tri/nhat-ky':   ['Quản trị', 'Nhật ký hoạt động'],
};

function getBreadcrumbs(pathname) {
  if (BREADCRUMB_MAP[pathname]) return BREADCRUMB_MAP[pathname];
  if (/^\/tai-lieu\/\d+\/sua$/.test(pathname)) return ['Tài liệu', 'Chỉnh sửa'];
  if (/^\/tai-lieu\/\d+$/.test(pathname))      return ['Tài liệu', 'Chi tiết'];
  if (/^\/tai-len\/[^/]+\/xu-ly$/.test(pathname)) return ['Tải lên', 'Xử lý ảnh'];
  if (/^\/tai-len\/[^/]+\/luu$/.test(pathname))   return ['Tải lên', 'Lưu tài liệu'];
  return [];
}

export function Topbar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const crumbs = getBreadcrumbs(pathname);

  // Dark/Light Mode state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('smartscan_theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('smartscan_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

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

      <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        {/* Dark/Light mode toggle */}
        <button
          className="btn-icon"
          type="button"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Chuyển sang chế độ tối' : 'Chuyển sang chế độ sáng'}
          aria-label="Đổi giao diện sáng/tối"
          style={{ cursor: 'pointer' }}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        {/* User profile pill */}
        <div
          className="topbar-user"
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
          onClick={() => navigate('/ho-so')}
          title="Xem hồ sơ cá nhân"
        >
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--color-primary-100)', color: 'var(--color-primary-700)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)'
          }}>
            {user?.username ? user.username.charAt(0).toUpperCase() : <User size={14} />}
          </div>
          <span className="topbar-user-name" style={{ fontWeight: 'var(--weight-medium)' }}>
            {user?.username}
          </span>
          <span className="badge badge-primary">{user?.role === 'admin' ? 'Admin' : 'User'}</span>
        </div>

        <button className="btn btn-ghost btn-sm" type="button" onClick={handleLogout}>
          <LogOut size={15} /> Đăng xuất
        </button>
      </div>
    </header>
  );
}
