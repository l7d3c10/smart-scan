import { Route, Routes } from 'react-router-dom';

function HomePage() {
  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="SmartScan — Trang chủ">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>SmartScan</span>
        </a>
        <span className="status-pill"><span className="status-dot" /> Khung dự án sẵn sàng</span>
      </header>

      <section className="welcome-card" aria-labelledby="welcome-title">
        <p className="eyebrow">SỐ HÓA VÀ QUẢN LÝ TÀI LIỆU</p>
        <h1 id="welcome-title">Tài liệu của bạn, <span>gọn gàng hơn.</span></h1>
        <p className="welcome-copy">
          SmartScan giúp lưu trữ tài liệu an toàn và làm rõ ảnh bằng xử lý OpenCV.
          Đây là khung khởi đầu của đồ án.
        </p>
        <div className="tech-list" aria-label="Công nghệ">
          <span>React</span>
          <span>Express</span>
          <span>PostgreSQL</span>
          <span>Python · OpenCV</span>
        </div>
      </section>

      <footer className="page-footer">SmartScan · Đồ án liên môn</footer>
    </main>
  );
}

function NotFoundPage() {
  return (
    <main className="page-shell">
      <section className="welcome-card">
        <p className="eyebrow">404</p>
        <h1>Không tìm thấy trang</h1>
        <a className="home-link" href="/">Về trang chủ</a>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
