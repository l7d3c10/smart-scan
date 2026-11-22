import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, FileScan, LoaderCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function RegisterPage() {
  const { register, user, loading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const checks = useMemo(() => ({
    length: password.length >= 8 && new TextEncoder().encode(password).length <= 72,
    letter: /[A-Za-z]/.test(password),
    number: /\d/.test(password),
  }), [password]);
  const strength = Object.values(checks).filter(Boolean).length;

  if (!loading && user) return <Navigate to="/tai-lieu" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Mật khẩu nhập lại chưa khớp.');
      return;
    }
    setSubmitting(true);
    try {
      await register({ username, password });
      navigate('/dang-nhap', { replace: true, state: { notice: 'Đăng ký thành công. Bạn có thể đăng nhập ngay.' } });
    } catch (requestError) {
      setError(requestError.message || 'Không thể tạo tài khoản lúc này. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="register-title">
        <div className="auth-brand"><span className="auth-brand-mark"><FileScan size={23} /></span><span>SmartScan</span></div>
        <h1 id="register-title">Tạo tài khoản</h1>
        <p className="auth-subtitle">Tài khoản mới được tạo với quyền User.</p>
        {error && <div className="auth-alert" role="alert">{error}</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="form-group">
            <span className="form-label">Tên đăng nhập</span>
            <input className="form-control auth-control" name="username" autoComplete="username" required minLength={3} maxLength={30} pattern="[A-Za-z0-9_]{3,30}" value={username} onChange={(event) => setUsername(event.target.value)} />
            <span className="auth-hint">3–30 ký tự: chữ không dấu, số hoặc dấu gạch dưới.</span>
          </label>
          <label className="form-group">
            <span className="form-label">Mật khẩu</span>
            <span className="auth-password-wrap">
              <input className="form-control auth-control" name="new-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
              <button className="auth-reveal" type="button" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
            </span>
          </label>
          <div className="password-strength" aria-label={`Độ mạnh mật khẩu: ${strength} trên 3`}>
            <div className="password-strength-bars">{[1, 2, 3].map((level) => <span key={level} className={strength >= level ? `strength-level-${strength}` : ''} />)}</div>
            <span>{password ? (strength === 3 ? 'Mật khẩu đạt yêu cầu' : 'Mật khẩu chưa đủ mạnh') : 'Độ mạnh mật khẩu'}</span>
          </div>
          <ul className="password-rules" aria-label="Yêu cầu mật khẩu">
            <li className={checks.length ? 'met' : ''}>Ít nhất 8 ký tự, tối đa 72 byte</li>
            <li className={checks.letter ? 'met' : ''}>Có chữ cái</li>
            <li className={checks.number ? 'met' : ''}>Có chữ số</li>
          </ul>
          <label className="form-group">
            <span className="form-label">Nhập lại mật khẩu</span>
            <input className="form-control auth-control" name="confirm-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
          </label>
          <button className="btn btn-primary btn-lg auth-submit" type="submit" disabled={submitting || strength < 3}>
            {submitting ? <><LoaderCircle className="spin-icon" size={17} /> Đang tạo tài khoản…</> : 'Đăng ký'}
          </button>
        </form>
        <p className="auth-switch">Đã có tài khoản? <Link to="/dang-nhap">Đăng nhập</Link></p>
      </section>
      <p className="auth-footer">Số hóa và quản lý tài liệu an toàn</p>
    </main>
  );
}
