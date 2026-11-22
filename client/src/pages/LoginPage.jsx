import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, FileScan, LoaderCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [retrySeconds, setRetrySeconds] = useState(0);

  useEffect(() => {
    if (retrySeconds <= 0) return undefined;
    const timer = setTimeout(() => setRetrySeconds((remaining) => Math.max(0, remaining - 1)), 1000);
    return () => clearTimeout(timer);
  }, [retrySeconds]);

  if (!loading && user) return <Navigate to="/tai-lieu" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await login({ username, password });
      const target = location.state?.from?.pathname;
      navigate(target?.startsWith('/') && !target.startsWith('//') ? target : '/tai-lieu', { replace: true });
    } catch (requestError) {
      setError(requestError.message || 'Không thể đăng nhập lúc này. Vui lòng thử lại.');
      if (requestError.retryAfterSeconds) setRetrySeconds(requestError.retryAfterSeconds);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <div className="auth-brand"><span className="auth-brand-mark"><FileScan size={23} /></span><span>SmartScan</span></div>
        <h1 id="login-title">Đăng nhập</h1>
        <p className="auth-subtitle">Đăng nhập để quản lý tài liệu của bạn.</p>
        {location.state?.notice && <div className="auth-notice" role="status">{location.state.notice}</div>}
        {error && <div className="auth-alert" role="alert">{error}{retrySeconds > 0 && <strong className="auth-countdown">Có thể thử lại sau {Math.floor(retrySeconds / 60)}:{String(retrySeconds % 60).padStart(2, '0')}.</strong>}</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="form-group">
            <span className="form-label">Tên đăng nhập</span>
            <input className="form-control auth-control" name="username" autoComplete="username" required maxLength={30} value={username} onChange={(event) => setUsername(event.target.value)} />
          </label>
          <label className="form-group">
            <span className="form-label">Mật khẩu</span>
            <span className="auth-password-wrap">
              <input className="form-control auth-control" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
              <button className="auth-reveal" type="button" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
            </span>
          </label>
          <button className="btn btn-primary btn-lg auth-submit" type="submit" disabled={submitting || retrySeconds > 0}>
            {submitting ? <><LoaderCircle className="spin-icon" size={17} /> Đang đăng nhập…</> : 'Đăng nhập'}
          </button>
        </form>
        <p className="auth-switch">Chưa có tài khoản? <Link to="/dang-ky">Đăng ký</Link></p>
      </section>
      <p className="auth-footer">Số hóa và quản lý tài liệu an toàn</p>
    </main>
  );
}
