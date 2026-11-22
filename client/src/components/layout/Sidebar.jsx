import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Upload,
  Users,
  ScrollText,
  Settings,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/',           label: 'Tổng quan',       icon: LayoutDashboard, disabled: false },
  { to: '/tai-lieu',   label: 'Tài liệu',         icon: FileText,        disabled: false },
  { to: '/tai-len',    label: 'Tải lên',          icon: Upload,          disabled: true },
  { to: '/nguoi-dung', label: 'Người dùng',       icon: Users,           disabled: true },
  { to: '/nhat-ky',    label: 'Nhật ký',          icon: ScrollText,      disabled: true },
  { to: '/cai-dat',    label: 'Cài đặt',          icon: Settings,        disabled: true },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">SS</div>
        <span className="sidebar-logo-text">SmartScan</span>
        <span className="sidebar-logo-version">v1.0</span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav" aria-label="Điều hướng chính">
        {NAV_ITEMS.map(({ to, label, icon: Icon, disabled }) => {
          if (disabled) {
            return (
              <div key={to} className="sidebar-nav-item disabled" aria-disabled="true">
                <Icon size={16} />
                <span className="sidebar-nav-label">{label}</span>
                <span className="sidebar-coming-soon">Sắp có</span>
              </div>
            );
          }

          const isActive =
            to === '/tai-lieu'
              ? location.pathname.startsWith('/tai-lieu')
              : location.pathname === to;

          return (
            <NavLink
              key={to}
              to={to}
              className={`sidebar-nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={16} />
              <span className="sidebar-nav-label">{label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">SmartScan · Đồ án liên môn</div>
    </aside>
  );
}
