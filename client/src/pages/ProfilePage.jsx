import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { User, KeyRound, Shield, CheckCircle, Clock } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { useToast } from '../hooks/useToast.js';
import { ToastContainer } from '../components/ui/ToastContainer.jsx';
import { api } from '../services/api.js';

export default function ProfilePage() {
  const { user } = useAuth();
  const { toasts, removeToast, success: toastSuccess, error: toastError } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Password strength calculator
  const strength = useMemo(() => {
    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[a-z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;
    return score;
  }, [newPassword]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      toastError('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    if (newPassword.length < 8) {
      toastError('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toastError('Mật khẩu nhập lại không khớp.');
      return;
    }

    setLoading(true);
    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      toastSuccess('Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toastError(err.message || 'Đổi mật khẩu thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Hồ sơ cá nhân & Bảo mật</h1>
        <p className="page-desc">Quản lý thông tin tài khoản và thiết lập an toàn mật khẩu</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        {/* User Card */}
        <div className="table-container" style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'var(--color-primary-100)', color: 'var(--color-primary-700)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'var(--text-2xl)', fontWeight: 'bold', margin: '0 auto var(--space-4)'
          }}>
            {user?.username ? user.username.charAt(0).toUpperCase() : <User size={32} />}
          </div>

          <h3 style={{ margin: '0 0 var(--space-1)', fontSize: 'var(--text-lg)', fontWeight: 'bold' }}>
            {user?.username}
          </h3>
          <span className="badge badge-primary" style={{ marginBottom: 'var(--space-4)' }}>
            {user?.role === 'admin' ? 'Quản trị viên (Admin)' : 'Người dùng (User)'}
          </span>

          <div style={{ textAlign: 'left', borderTop: '1px solid var(--border-default)', paddingTop: 'var(--space-4)', fontSize: 'var(--text-sm)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <div>ID tài khoản: <strong>#{user?.id}</strong></div>
            <div>Trạng thái: <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>✓ Đang hoạt động</span></div>
            <div>Phiên đăng nhập: <strong>PostgreSQL Session</strong></div>
          </div>
        </div>

        {/* Change password form */}
        <div className="table-container" style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            <KeyRound size={18} color="var(--color-primary-600)" /> Đổi mật khẩu đăng nhập
          </h3>

          <form onSubmit={handleChangePassword}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxWidth: 440 }}>
              <Input
                id="current-password"
                type="password"
                label="Mật khẩu hiện tại"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />

              <div>
                <Input
                  id="new-password"
                  type="password"
                  label="Mật khẩu mới"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                {newPassword && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ display: 'flex', gap: 4, height: 4 }}>
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <div
                          key={lvl}
                          style={{
                            flex: 1,
                            borderRadius: 2,
                            background: strength >= lvl ? (strength <= 2 ? 'var(--color-danger)' : strength <= 3 ? 'var(--color-warning)' : 'var(--color-success)') : 'var(--border-default)'
                          }}
                        />
                      ))}
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                      Độ mạnh mật khẩu: {strength <= 2 ? 'Yếu' : strength <= 3 ? 'Trung bình' : 'Mạnh'}
                    </span>
                  </div>
                )}
              </div>

              <Input
                id="confirm-password"
                type="password"
                label="Xác nhận mật khẩu mới"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <div style={{ marginTop: 'var(--space-2)' }}>
                <Button variant="primary" type="submit" loading={loading}>
                  Lưu thay đổi mật khẩu
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
