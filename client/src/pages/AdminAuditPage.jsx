import { useCallback, useEffect, useState } from 'react';
import { Download, RefreshCw, Search } from 'lucide-react';
import { adminService } from '../services/admin.service.js';

const ACTION_LABELS = {
  LOGIN_SUCCESS: 'Đăng nhập thành công', LOGIN_FAIL: 'Đăng nhập thất bại', LOGOUT: 'Đăng xuất',
  REGISTER: 'Đăng ký', PASSWORD_CHANGE: 'Đổi mật khẩu', PROCESS_IMAGE: 'Xử lý ảnh',
  DOC_CREATE: 'Tạo tài liệu', DOC_UPDATE: 'Cập nhật tài liệu', DOC_DELETE: 'Xóa tài liệu',
  DOC_COPY: 'Sao chép tài liệu', DOC_IMPORT: 'Nhập dữ liệu', DOC_EXPORT: 'Xuất dữ liệu',
  ADMIN_ROLE_CHANGE: 'Đổi vai trò', ADMIN_LOCK: 'Khóa tài khoản',
  ADMIN_UNLOCK: 'Mở khóa tài khoản', ADMIN_RESET_PASSWORD: 'Đặt lại mật khẩu',
};
const ACTIONS = Object.entries(ACTION_LABELS);

function formatDate(value) {
  return value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'medium', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value)) : '—';
}

export default function AdminAuditPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await adminService.auditLogs({ search, action, from, to, page: String(page) }));
    } catch (requestError) {
      setError(requestError.message || 'Không tải được nhật ký hoạt động.');
    } finally {
      setLoading(false);
    }
  }, [search, action, from, to, page]);

  useEffect(() => { load(); }, [load]);

  function applySearch(event) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  async function exportJson() {
    setExporting(true);
    setError('');
    try {
      const result = await adminService.auditLogs({ search, action, from, to, export: 'json' });
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `smartscan-audit-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      if (result.truncated) setError('File chỉ chứa 10.000 dòng mới nhất trong kết quả lọc.');
    } catch (requestError) {
      setError(requestError.message || 'Không xuất được nhật ký.');
    } finally {
      setExporting(false);
    }
  }

  function clearFilters() {
    setSearchInput(''); setSearch(''); setAction(''); setFrom(''); setTo(''); setPage(1);
  }

  return (
    <section className="admin-page">
      <header className="page-header"><div className="page-header-left"><h1 className="page-title">Nhật ký hoạt động</h1><p className="page-desc">Lịch sử đăng nhập, tài liệu và thao tác quản trị.</p></div></header>
      {error && <div className="admin-error" role="alert"><span>{error}</span><button className="btn btn-secondary btn-sm" type="button" onClick={load}>Thử lại</button></div>}
      <div className="admin-toolbar audit-toolbar">
        <form className="admin-search" onSubmit={applySearch}><Search size={16} /><input aria-label="Tìm trong nhật ký" placeholder="Tìm người dùng hoặc nội dung" maxLength={100} value={searchInput} onChange={(event) => setSearchInput(event.target.value)} /><button className="btn btn-secondary btn-sm" type="submit">Tìm</button></form>
        <select className="form-control admin-filter" aria-label="Lọc loại hoạt động" value={action} onChange={(event) => { setAction(event.target.value); setPage(1); }}><option value="">Tất cả hoạt động</option>{ACTIONS.map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select>
        <label className="audit-date-filter"><span>Từ</span><input className="form-control" type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} /></label>
        <label className="audit-date-filter"><span>Đến</span><input className="form-control" type="date" value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} /></label>
        <button className="btn btn-secondary btn-sm" type="button" onClick={clearFilters}>Xóa lọc</button>
        <button className="btn btn-primary btn-sm" type="button" onClick={exportJson} disabled={exporting}><Download size={15} /> {exporting ? 'Đang xuất…' : 'Xuất JSON'}</button>
        <button className="btn btn-ghost btn-sm" type="button" onClick={load} aria-label="Tải lại nhật ký"><RefreshCw size={15} /></button>
      </div>

      <div className="table-container admin-table-wrap">
        <table className="data-table audit-table">
          <thead><tr><th>Thời gian</th><th>Người thực hiện</th><th>Hoạt động</th><th>Tài liệu</th><th>Chi tiết</th><th>IP</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan="6" className="admin-table-message">Đang tải nhật ký…</td></tr>}
            {!loading && data?.items.length === 0 && <tr><td colSpan="6" className="admin-table-message">Không có hoạt động phù hợp.</td></tr>}
            {!loading && data?.items.map((log) => <tr key={log.id}>
              <td className="audit-time">{formatDate(log.created_at)}</td>
              <td>{log.actor_username}</td>
              <td><span className="badge badge-default">{ACTION_LABELS[log.action] || log.action}</span></td>
              <td>{log.document_code ? `${log.document_code} · ${log.document_title}` : (log.document_id ? `ID ${log.document_id}` : '—')}</td>
              <td className="audit-detail" title={log.detail || ''}>{log.detail || '—'}</td>
              <td>{log.ip || '—'}</td>
            </tr>)}
          </tbody>
        </table>
        <div className="table-footer"><span className="table-footer-info">{data ? `${data.total} hoạt động` : ''}</span><div className="pagination"><button className="pagination-btn" type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Trước</button><span className="table-footer-info">Trang {data?.page || page} / {Math.max(data?.totalPages || 1, 1)}</span><button className="pagination-btn" type="button" disabled={loading || page >= (data?.totalPages || 1)} onClick={() => setPage((value) => value + 1)}>Sau</button></div></div>
      </div>
    </section>
  );
}
