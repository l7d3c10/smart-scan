import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Upload,
  Users,
  ScrollText,
  UserCheck,
  FileSpreadsheet,
  Folder,
  Star,
  Clock,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">SS</div>
        <span className="sidebar-logo-text">SmartScan</span>
        <span className="sidebar-logo-version">v2.0</span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav" aria-label="Điều hướng chính">
        <div className="sidebar-section-title" style={{
          fontSize: 'var(--text-xs)',
          fontWeight: 'var(--weight-semibold)',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          padding: 'var(--space-2) var(--space-3)',
          letterSpacing: '0.05em'
        }}>
          Chức năng chính
        </div>

        <NavLink
          to="/"
          className={`sidebar-nav-item${location.pathname === '/' ? ' active' : ''}`}
        >
          <LayoutDashboard size={16} />
          <span className="sidebar-nav-label">Tổng quan</span>
        </NavLink>

        <div className="sidebar-section-title" style={{
          fontSize: 'var(--text-xs)',
          fontWeight: 'var(--weight-semibold)',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          padding: 'var(--space-3) var(--space-3) var(--space-1)',
          letterSpacing: '0.05em'
        }}>
          Kho tài liệu
        </div>

        <NavLink
          to="/tai-lieu"
          className={`sidebar-nav-item${location.pathname === '/tai-lieu' || (location.pathname.startsWith('/tai-lieu/') && !location.pathname.startsWith('/tai-lieu/nhap')) ? ' active' : ''}`}
        >
          <FileText size={16} />
          <span className="sidebar-nav-label">Tất cả tài liệu</span>
        </NavLink>

        <NavLink
          to="/thu-muc"
          className={`sidebar-nav-item${location.pathname.startsWith('/thu-muc') ? ' active' : ''}`}
        >
          <Folder size={16} />
          <span className="sidebar-nav-label">Thư mục</span>
        </NavLink>

        <NavLink
          to="/yeu-thich"
          className={`sidebar-nav-item${location.pathname.startsWith('/yeu-thich') ? ' active' : ''}`}
        >
          <Star size={16} />
          <span className="sidebar-nav-label">Đã đánh dấu sao</span>
        </NavLink>

        <NavLink
          to="/gan-day"
          className={`sidebar-nav-item${location.pathname.startsWith('/gan-day') ? ' active' : ''}`}
        >
          <Clock size={16} />
          <span className="sidebar-nav-label">Mở gần đây</span>
        </NavLink>

        <NavLink
          to="/thung-rac"
          className={`sidebar-nav-item${location.pathname.startsWith('/thung-rac') ? ' active' : ''}`}
        >
          <Trash2 size={16} />
          <span className="sidebar-nav-label">Thùng rác</span>
        </NavLink>

        <NavLink
          to="/tai-lieu/nhap"
          className={`sidebar-nav-item${location.pathname === '/tai-lieu/nhap' ? ' active' : ''}`}
        >
          <FileSpreadsheet size={16} />
          <span className="sidebar-nav-label">Nhập Excel/JSON</span>
        </NavLink>

        <div className="sidebar-section-title" style={{
          fontSize: 'var(--text-xs)',
          fontWeight: 'var(--weight-semibold)',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          padding: 'var(--space-3) var(--space-3) var(--space-1)',
          letterSpacing: '0.05em'
        }}>
          Xử lý & Tài khoản
        </div>

        <NavLink
          to="/tai-len"
          className={`sidebar-nav-item${location.pathname.startsWith('/tai-len') ? ' active' : ''}`}
        >
          <Upload size={16} />
          <span className="sidebar-nav-label">Tải ảnh lên</span>
        </NavLink>

        <NavLink
          to="/ho-so"
          className={`sidebar-nav-item${location.pathname === '/ho-so' ? ' active' : ''}`}
        >
          <UserCheck size={16} />
          <span className="sidebar-nav-label">Hồ sơ cá nhân</span>
        </NavLink>

        {/* Admin section */}
        {isAdmin && (
          <>
            <div className="sidebar-section-title" style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--weight-semibold)',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              padding: 'var(--space-4) var(--space-3) var(--space-2)',
              letterSpacing: '0.05em'
            }}>
              Quản trị hệ thống
            </div>

            <NavLink
              to="/quan-tri/nguoi-dung"
              className={`sidebar-nav-item${location.pathname.startsWith('/quan-tri/nguoi-dung') ? ' active' : ''}`}
            >
              <Users size={16} />
              <span className="sidebar-nav-label">Người dùng</span>
            </NavLink>

            <NavLink
              to="/quan-tri/nhat-ky"
              className={`sidebar-nav-item${location.pathname.startsWith('/quan-tri/nhat-ky') ? ' active' : ''}`}
            >
              <ScrollText size={16} />
              <span className="sidebar-nav-label">Nhật ký hoạt động</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">SmartScan · Số hóa an toàn</div>
    </aside>
  );
}
