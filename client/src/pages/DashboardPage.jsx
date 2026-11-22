import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend,
  LinearScale, Tooltip,
} from 'chart.js';
import { ArrowRight, FileText, Files, ScanLine, Upload, Users } from 'lucide-react';
import { dashboardService } from '../services/dashboard.service.js';
import { useAuth } from '../context/AuthContext.jsx';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(value));
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await dashboardService.load());
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải dữ liệu tổng quan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <section className="dashboard-page">
      <header className="page-header"><div className="page-header-left"><h1 className="page-title">Tổng quan</h1><p className="page-desc">Tình hình tài liệu của bạn</p></div></header>
      <div className="dashboard-stat-grid">{[1, 2, 3, 4].map((item) => <div className="dashboard-stat-card" key={item}><span className="skeleton skeleton-text dashboard-skeleton-label" /><span className="skeleton dashboard-skeleton-value" /></div>)}</div>
      <div className="dashboard-chart-grid"><div className="dashboard-panel dashboard-skeleton-panel"><span className="skeleton skeleton-text dashboard-skeleton-label" /></div><div className="dashboard-panel dashboard-skeleton-panel"><span className="skeleton skeleton-text dashboard-skeleton-label" /></div></div>
    </section>;
  }

  if (error) {
    return <section className="dashboard-page">
      <header className="page-header"><div className="page-header-left"><h1 className="page-title">Tổng quan</h1><p className="page-desc">Tình hình tài liệu của bạn</p></div></header>
      <div className="dashboard-error" role="alert"><p>{error}</p><button className="btn btn-secondary btn-sm" onClick={load} type="button">Thử lại</button></div>
    </section>;
  }

  const { summary, monthly, byType, recentDocuments } = data;
  const empty = summary.totalDocuments === 0;
  const stats = [
    { label: 'Tổng tài liệu', value: summary.totalDocuments, icon: Files, tone: 'blue' },
    { label: 'Tải lên tháng này', value: summary.uploadsThisMonth, icon: Upload, tone: 'violet' },
    { label: 'Đã xử lý ảnh', value: summary.processedDocuments, icon: ScanLine, tone: 'green' },
    { label: 'Chưa xử lý', value: summary.unprocessedDocuments, icon: FileText, tone: 'amber' },
    ...(summary.totalUsers !== undefined ? [{ label: 'Tổng người dùng', value: summary.totalUsers, icon: Users, tone: 'slate' }] : []),
  ];
  const monthlyData = {
    labels: monthly.map((item) => {
      const [year, month] = item.month.split('-');
      return `${month}/${year.slice(-2)}`;
    }),
    datasets: [{
      label: 'Tài liệu mới',
      data: monthly.map((item) => item.count),
      backgroundColor: '#3b82f6',
      borderRadius: 5,
      maxBarThickness: 30,
    }],
  };
  const typeData = {
    labels: byType.map((item) => item.label),
    datasets: [{
      data: byType.map((item) => item.count),
      backgroundColor: ['#3b82f6', '#f59e0b', '#22c55e', '#94a3b8', '#a78bfa'],
      borderWidth: 0,
      hoverOffset: 5,
    }],
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
    scales: {
      x: { grid: { display: false }, border: { display: false } },
      y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#eef2f7' }, border: { display: false } },
    },
  };
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 7, padding: 14 } } },
  };

  return (
    <section className="dashboard-page">
      <header className="page-header">
        <div className="page-header-left"><h1 className="page-title">Tổng quan</h1><p className="page-desc">Xin chào {user?.username}, đây là tình hình tài liệu của bạn.</p></div>
        <Link className="btn btn-primary btn-md" to="/tai-lieu/them"><Upload size={15} /> Tạo tài liệu</Link>
      </header>

      <div className="dashboard-stat-grid">
        {stats.map(({ label, value, icon: Icon, tone }) => <article className="dashboard-stat-card" key={label}>
          <div className={`dashboard-stat-icon ${tone}`}><Icon size={18} /></div>
          <div className="dashboard-stat-copy"><span className="dashboard-stat-label">{label}</span><strong className="dashboard-stat-value">{value.toLocaleString('vi-VN')}</strong></div>
        </article>)}
      </div>

      {empty ? <div className="dashboard-empty">
        <div className="dashboard-empty-icon"><FileText size={24} /></div>
        <h2>Chưa có tài liệu nào</h2><p>Tạo tài liệu đầu tiên để bắt đầu quản lý hồ sơ của bạn.</p>
        <Link className="btn btn-primary btn-md" to="/tai-lieu/them">Tạo tài liệu đầu tiên</Link>
      </div> : <>
        <div className="dashboard-chart-grid">
          <article className="dashboard-panel">
            <div className="dashboard-panel-heading"><div><h2>Tài liệu theo tháng</h2><p>12 tháng gần nhất</p></div></div>
            <div className="dashboard-bar-wrap"><Bar data={monthlyData} options={chartOptions} /></div>
          </article>
          <article className="dashboard-panel">
            <div className="dashboard-panel-heading"><div><h2>Tài liệu theo loại</h2><p>Phân bố hồ sơ hiện có</p></div></div>
            <div className="dashboard-doughnut-wrap"><Doughnut data={typeData} options={doughnutOptions} /></div>
          </article>
        </div>
        <article className="dashboard-panel dashboard-recent-panel">
          <div className="dashboard-panel-heading"><div><h2>Tài liệu gần đây</h2><p>Năm tài liệu được tạo gần nhất</p></div><Link to="/tai-lieu" className="dashboard-see-all">Xem tất cả <ArrowRight size={14} /></Link></div>
          <div className="dashboard-recent-list">
            {recentDocuments.map((document) => <Link className="dashboard-recent-row" key={document.id} to={`/tai-lieu/${document.id}`}>
              <span className="dashboard-document-icon"><FileText size={17} /></span>
              <span className="dashboard-document-main"><strong>{document.title}</strong><small>{document.code} · {document.type_label}</small></span>
              <time dateTime={document.created_at}>{formatDate(document.created_at)}</time>
              <ArrowRight size={15} className="dashboard-row-arrow" />
            </Link>)}
          </div>
        </article>
      </>}
    </section>
  );
}
