import { useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

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
  const crumbs = getBreadcrumbs(pathname);

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
        {/* Avatar placeholder – auth do Người 3 triển khai */}
        <div className="topbar-avatar" title="Tài khoản (chưa tích hợp)">
          A
        </div>
      </div>
    </header>
  );
}
