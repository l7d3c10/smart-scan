import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, CircleAlert, ShieldX } from 'lucide-react';

export function StatusErrorPage({ status = 500 }) {
  const location = useLocation();
  const forbidden = status === 403;
  const icon = forbidden ? ShieldX : CircleAlert;
  const Icon = icon;
  const content = forbidden
    ? { title: 'Bạn không có quyền truy cập', description: 'Tài khoản hiện tại không được phép mở trang hoặc tài liệu này.' }
    : { title: 'Đã xảy ra lỗi hệ thống', description: 'Máy chủ chưa thể hoàn tất yêu cầu. Bạn có thể thử lại sau.' };

  return (
    <main className="status-error-page">
      <div className={`status-error-icon ${forbidden ? 'forbidden' : ''}`}><Icon size={30} /></div>
      <p className="status-error-code">{status}</p>
      <h1>{content.title}</h1>
      <p className="status-error-description">{content.description}</p>
      {location.state?.ref && <p className="status-error-reference">Mã tham chiếu: <code>{location.state.ref}</code></p>}
      <div className="status-error-actions">
        <button className="btn btn-secondary btn-md" type="button" onClick={() => window.history.back()}><ArrowLeft size={15} /> Quay lại</button>
        <Link className="btn btn-primary btn-md" to="/">Về tổng quan</Link>
      </div>
    </main>
  );
}
