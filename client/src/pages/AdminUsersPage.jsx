import { useCallback, useEffect, useState } from 'react';
import { LockKeyhole, RefreshCw, Search, ShieldCheck, UnlockKeyhole } from 'lucide-react';
import { adminService } from '../services/admin.service.js';
import { Modal } from '../components/ui/Modal.jsx';
import { Button } from '../components/ui/Button.jsx';

function formatDate(value) {
  return value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value)) : '—';
}

export default function AdminUsersPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetting, setResetting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await adminService.users({ search, role, status, page: String(page) }));
    } catch (requestError) {
      setError(requestError.message || 'Không tải được danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  }, [search, role, status, page]);

  useEffect(() => { load(); }, [load]);

  async function changeRole(user, nextRole) {
    if (nextRole === user.role) return;
    const label = nextRole === 'admin' ? 'Admin' : 'User';
    if (!window.confirm(`Đổi vai trò của ${user.username} thành ${label}?`)) return;
    setNotice('');
    try {
      await adminService.setRole(user.id, nextRole);
      setNotice(`Đã đổi vai trò tài khoản ${user.username}.`);
      await load();
    } catch (requestError) {
      setError(requestError.message || 'Không đổi được vai trò.');
    }
  }

  async function toggleLock(user) {
    const action = user.locked ? 'mở khóa' : 'khóa';
    if (!window.confirm(`Bạn có chắc muốn ${action} tài khoản ${user.username}?`)) return;
    setNotice('');
    try {
      if (user.locked) await adminService.unlockUser(user.id);
      else await adminService.lockUser(user.id);
      setNotice(`Đã ${user.locked ? 'mở khóa' : 'khóa'} tài khoản ${user.username}.`);
      await load();
    } catch (requestError) {
      setError(requestError.message || `Không thể ${action} tài khoản.`);
    }
  }

  function openResetPassword(user) {
    setResetTarget(user);
    setNewPassword('');
    setConfirmPassword('');
    setResetError('');
  }

  async function submitResetPassword(event) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setResetError('Mật khẩu nhập lại chưa khớp.');
      return;
    }
    if (newPassword.length < 8 || new TextEncoder().encode(newPassword).length > 72 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setResetError('Mật khẩu cần ít nhất 8 ký tự, tối đa 72 byte, gồm chữ và số.');
      return;
    }
    setNotice('');
    setResetting(true);
    try {
      await adminService.resetPassword(resetTarget.id, newPassword);
      setNotice(`Đã đặt lại mật khẩu và thu hồi phiên của ${resetTarget.username}.`);
      setResetTarget(null);
    } catch (requestError) {
      setResetError(requestError.message || 'Không đặt lại được mật khẩu.');
    } finally {
      setResetting(false);
    }
  }

  function applySearch(event) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  return (
    <section className="admin-page">
      <header className="page-header"><div className="page-header-left"><h1 className="page-title">Quản lý người dùng</h1><p className="page-desc">Phân quyền, khóa tài khoản và đặt lại mật khẩu.</p></div></header>
      {notice && <div className="admin-notice" role="status">{notice}</div>}
      {error && <div className="admin-error" role="alert"><span>{error}</span><button className="btn btn-secondary btn-sm" type="button" onClick={load}>Thử lại</button></div>}
      <div className="admin-toolbar">
        <form className="admin-search" onSubmit={applySearch}>
          <Search size={16} />
          <input aria-label="Tìm tên đăng nhập" placeholder="Tìm tên đăng nhập" maxLength={30} value={searchInput} onChange={(event) => setSearchInput(event.target.value)} />
          <button className="btn btn-secondary btn-sm" type="submit">Tìm</button>
        </form>
        <select className="form-control admin-filter" aria-label="Lọc theo vai trò" value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }}>
          <option value="">Tất cả vai trò</option><option value="user">User</option><option value="admin">Admin</option>
        </select>
        <select className="form-control admin-filter" aria-label="Lọc theo trạng thái" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
          <option value="">Tất cả trạng thái</option><option value="active">Đang hoạt động</option><option value="locked">Đã khóa</option>
        </select>
        <button className="btn btn-ghost btn-sm" type="button" onClick={load} aria-label="Tải lại danh sách"><RefreshCw size={15} /></button>
      </div>

      <div className="table-container admin-table-wrap">
        <table className="data-table admin-users-table">
          <thead><tr><th>Tên đăng nhập</th><th>Vai trò</th><th>Trạng thái</th><th>Đăng ký</th><th>Thao tác</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan="5" className="admin-table-message">Đang tải danh sách…</td></tr>}
            {!loading && data?.items.length === 0 && <tr><td colSpan="5" className="admin-table-message">Không tìm thấy người dùng.</td></tr>}
            {!loading && data?.items.map((user) => <tr key={user.id}>
              <td><strong>{user.username}</strong>{user.locked_until && <small className="admin-lock-note">Khóa tạm đến {formatDate(user.locked_until)}</small>}</td>
              <td><span className={`badge ${user.role === 'admin' ? 'badge-primary' : 'badge-default'}`}>{user.role === 'admin' ? 'Admin' : 'User'}</span></td>
              <td><span className={`badge ${user.locked ? 'badge-danger' : 'badge-success'}`}>{user.locked ? 'Đã khóa' : 'Hoạt động'}</span></td>
              <td>{formatDate(user.created_at)}</td>
              <td><div className="admin-row-actions">
                <select aria-label={`Vai trò của ${user.username}`} className="form-control admin-role-select" value={user.role} onChange={(event) => changeRole(user, event.target.value)}>
                  <option value="user">User</option><option value="admin">Admin</option>
                </select>
                <button className="btn btn-secondary btn-sm" type="button" onClick={() => toggleLock(user)} title={user.locked ? 'Mở khóa' : 'Khóa tài khoản'}>{user.locked ? <UnlockKeyhole size={14} /> : <LockKeyhole size={14} />}</button>
                <button className="btn btn-secondary btn-sm" type="button" onClick={() => openResetPassword(user)} title="Đặt lại mật khẩu"><ShieldCheck size={14} /> Đặt lại</button>
              </div></td>
            </tr>)}
          </tbody>
        </table>
        <div className="table-footer"><span className="table-footer-info">{data ? `${data.total} người dùng` : ''}</span><div className="pagination"><button className="pagination-btn" type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Trước</button><span className="table-footer-info">Trang {data?.page || page} / {Math.max(data?.totalPages || 1, 1)}</span><button className="pagination-btn" type="button" disabled={loading || page >= (data?.totalPages || 1)} onClick={() => setPage((value) => value + 1)}>Sau</button></div></div>
      </div>
      <Modal
        isOpen={Boolean(resetTarget)}
        onClose={() => { if (!resetting) setResetTarget(null); }}
        title={`Đặt lại mật khẩu${resetTarget ? ` · ${resetTarget.username}` : ''}`}
        footer={<><Button onClick={() => setResetTarget(null)} disabled={resetting}>Hủy</Button><Button variant="primary" type="submit" form="reset-password-form" loading={resetting}>Đặt lại mật khẩu</Button></>}
      >
        <form id="reset-password-form" className="auth-form" onSubmit={submitResetPassword}>
          <label className="form-group"><span className="form-label">Mật khẩu mới</span><input className="form-control" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required /></label>
          <label className="form-group"><span className="form-label">Nhập lại mật khẩu</span><input className="form-control" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></label>
          <span className="auth-hint">Tối thiểu 8 ký tự, gồm chữ và số; tối đa 72 byte.</span>
          {resetError && <div className="auth-alert" role="alert">{resetError}</div>}
        </form>
      </Modal>
    </section>
  );
}
