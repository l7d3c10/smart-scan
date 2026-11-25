import { useState } from 'react';
import { KeyRound, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import { Button } from '../components/ui/Button.jsx';

export default function ProfilePage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu nhập lại chưa khớp.');
      return;
    }
    if (newPassword.length < 8 || new TextEncoder().encode(newPassword).length > 72 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setError('Mật khẩu mới cần ít nhất 8 ký tự, tối đa 72 byte, gồm chữ và số.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword, confirmPassword });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setNotice('Đã đổi mật khẩu. Các phiên đăng nhập khác đã bị đăng xuất.');
    } catch (requestError) {
      setError(requestError.message || 'Không đổi được mật khẩu.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="profile-page">
      <header className="page-header"><div className="page-header-left"><h1 className="page-title">Hồ sơ</h1><p className="page-desc">Thông tin tài khoản và bảo mật đăng nhập.</p></div></header>
      <div className="profile-grid">
        <article className="dashboard-panel profile-card">
          <div className="dashboard-panel-heading"><div><h2>Thông tin tài khoản</h2><p>Thông tin hiện tại của bạn</p></div></div>
          <div className="profile-user-icon"><UserRound size={22} /></div>
          <dl className="profile-details"><div><dt>Tên đăng nhập</dt><dd>{user?.username}</dd></div><div><dt>Vai trò</dt><dd><span className={`badge ${user?.role === 'admin' ? 'badge-primary' : 'badge-default'}`}>{user?.role === 'admin' ? 'Admin' : 'User'}</span></dd></div></dl>
        </article>
        <article className="dashboard-panel profile-card">
          <div className="dashboard-panel-heading"><div><h2>Đổi mật khẩu</h2><p>Đăng xuất các phiên khác sau khi đổi.</p></div><KeyRound size={18} color="var(--color-primary-600)" /></div>
          {notice && <div className="admin-notice" role="status">{notice}</div>}
          {error && <div className="admin-error" role="alert">{error}</div>}
          <form className="profile-password-form" onSubmit={handleSubmit}>
            <label className="form-group"><span className="form-label">Mật khẩu hiện tại</span><input className="form-control auth-control" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required /></label>
            <label className="form-group"><span className="form-label">Mật khẩu mới</span><input className="form-control auth-control" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required /></label>
            <span className="auth-hint">Tối thiểu 8 ký tự, gồm chữ và số; tối đa 72 byte.</span>
            <label className="form-group"><span className="form-label">Nhập lại mật khẩu mới</span><input className="form-control auth-control" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></label>
            <Button variant="primary" type="submit" loading={saving} disabled={!currentPassword || !newPassword || !confirmPassword}>Đổi mật khẩu</Button>
          </form>
        </article>
      </div>
    </section>
  );
}
