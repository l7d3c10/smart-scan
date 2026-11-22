import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus, RefreshCw, Eye, Pencil, Trash2, Download, FileSpreadsheet,
  FileWarning, AlertCircle,
} from 'lucide-react';
import { createDocumentsXlsx } from '../services/xlsx-export.js';
import { useDocuments } from '../hooks/useDocuments.js';
import { useToast } from '../hooks/useToast.js';
import { documentService } from '../services/document.service.js';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { SearchInput } from '../components/ui/SearchInput.jsx';
import { Select } from '../components/ui/Select.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { SkeletonRow } from '../components/ui/Skeleton.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';
import { ToastContainer } from '../components/ui/ToastContainer.jsx';

/* ── Constants ── */
const TYPE_OPTIONS = [
  { value: '',         label: 'Tất cả loại' },
  { value: 'hoa_don',  label: 'Hóa đơn' },
  { value: 'hop_dong', label: 'Hợp đồng' },
  { value: 'giay_to',  label: 'Giấy tờ' },
  { value: 'bien_ban', label: 'Biên bản' },
  { value: 'khac',     label: 'Khác' },
];

const SORT_OPTIONS = [
  { value: 'created_at_desc', label: 'Mới nhất' },
  { value: 'title_asc',       label: 'Tên A–Z' },
];

const TYPE_BADGE_VARIANT = {
  hoa_don:  'info',
  hop_dong: 'warning',
  giay_to:  'success',
  bien_ban: 'default',
  khac:     'default',
};

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function truncate(str, n) {
  if (!str) return '—';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

/* ── Stats strip computed from items ── */
function useStats(data) {
  return useMemo(() => {
    if (!data) return null;
    const counts = { hoa_don: 0, hop_dong: 0, giay_to: 0, bien_ban: 0, khac: 0 };
    // We only have current page; total breakdown not provided by API so we show total only.
    return { total: data.total };
  }, [data]);
}

/* ── Main Component ── */
export default function DocumentListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter state synced with URL
  const [searchInput, setSearchInput]   = useState(searchParams.get('search') || '');
  const [search,      setSearch]        = useState(searchParams.get('search') || '');
  const [type,        setType]          = useState(searchParams.get('type')   || '');
  const [sort,        setSort]          = useState(searchParams.get('sort')   || 'created_at_desc');
  const [page,        setPage]          = useState(Number(searchParams.get('page')) || 1);

  // Debounce search
  const debounceRef = useRef(null);
  const handleSearchInput = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 300);
  };

  // Sync URL
  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (type)   params.type   = type;
    if (sort !== 'created_at_desc') params.sort = sort;
    if (page > 1) params.page = page;
    setSearchParams(params, { replace: true });
  }, [search, type, sort, page, setSearchParams]);

  const { data, loading, error, refetch } = useDocuments({ search, type, page, limit: 20, sort });
  const stats = useStats(data);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);
  const [exporting, setExporting] = useState('');
  const { toasts, removeToast, success: toastSuccess, error: toastError } = useToast();

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await documentService.delete(deleteTarget.id);
      toastSuccess(`Đã xóa tài liệu "${deleteTarget.title}"`);
      setDeleteTarget(null);
      refetch();
    } catch {
      toastError('Xóa tài liệu thất bại. Vui lòng thử lại.');
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, refetch, toastSuccess, toastError]);

  const hasFilter = search || type;

  const handleResetFilter = () => {
    setSearchInput('');
    setSearch('');
    setType('');
    setSort('created_at_desc');
    setPage(1);
  };

  const handleExport = async (format) => {
    setExporting(format);
    try {
      const { items } = await documentService.export({ search, type, sort });
      let blob;
      const today = new Date().toISOString().slice(0, 10);
      let filename;
      if (format === 'json') {
        blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json;charset=utf-8' });
        filename = `smartscan-tai-lieu-${today}.json`;
      } else {
        const buffer = createDocumentsXlsx(items);
        blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        filename = `smartscan-tai-lieu-${today}.xlsx`;
      }

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      toastSuccess(`Đã xuất ${items.length} tài liệu ra ${format === 'json' ? 'JSON' : 'Excel'}.`);
    } catch (exportError) {
      toastError(exportError.message || 'Xuất dữ liệu thất bại.');
    } finally {
      setExporting('');
    }
  };

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Quản lý tài liệu</h1>
          <p className="page-desc">Lưu trữ và tra cứu tài liệu số hóa của tổ chức</p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => navigate('/tai-lieu/them')}
        >
          Thêm tài liệu
        </Button>
      </div>

      {/* Stats strip */}
      {stats && (
        <div className="stat-strip">
          <div className="stat-item">
            <span className="stat-label">Tổng tài liệu</span>
            <span className="stat-value">{stats.total}</span>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="toolbar">
        <SearchInput
          placeholder="Tìm kiếm tên tài liệu..."
          value={searchInput}
          onChange={handleSearchInput}
        />
        <select
          className="form-control form-select"
          style={{ width: 160 }}
          value={type}
          onChange={(e) => { setType(e.target.value); setPage(1); }}
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          className="form-control form-select"
          style={{ width: 140 }}
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1); }}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <div className="toolbar-spacer" />
        <Button variant="secondary" size="sm" icon={Download} loading={exporting === 'json'} disabled={Boolean(exporting)} onClick={() => handleExport('json')}>JSON</Button>
        <Button variant="secondary" size="sm" icon={FileSpreadsheet} loading={exporting === 'excel'} disabled={Boolean(exporting)} onClick={() => handleExport('excel')}>Excel</Button>
        {hasFilter && (
          <Button variant="ghost" size="sm" onClick={handleResetFilter}>
            Xóa bộ lọc
          </Button>
        )}
        <button
          className="btn-icon"
          onClick={refetch}
          title="Làm mới"
          aria-label="Làm mới dữ liệu"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 44 }}>#</th>
              <th style={{ width: 100 }}>Mã</th>
              <th>Tên tài liệu</th>
              <th style={{ width: 110 }}>Loại</th>
              <th style={{ width: 220 }}>Mô tả</th>
              <th style={{ width: 110 }}>Ngày tạo</th>
              <th style={{ width: 100 }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={7} />)}

            {!loading && error && (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    icon={AlertCircle}
                    title="Không thể tải dữ liệu"
                    description={error.message || 'Lỗi kết nối đến máy chủ.'}
                    action={
                      <Button size="sm" onClick={refetch}>Thử lại</Button>
                    }
                  />
                </td>
              </tr>
            )}

            {!loading && !error && data?.items?.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    icon={FileWarning}
                    title="Không tìm thấy tài liệu"
                    description={hasFilter ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.' : 'Chưa có tài liệu nào. Hãy thêm tài liệu đầu tiên.'}
                    action={
                      hasFilter
                        ? <Button size="sm" variant="secondary" onClick={handleResetFilter}>Xóa bộ lọc</Button>
                        : <Button size="sm" icon={Plus} onClick={() => navigate('/tai-lieu/them')}>Thêm tài liệu</Button>
                    }
                  />
                </td>
              </tr>
            )}

            {!loading && !error && data?.items?.map((doc, idx) => {
              const rowNum = (page - 1) * 20 + idx + 1;
              return (
                <tr key={doc.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>{rowNum}</td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                      {doc.code}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        display: 'block',
                        maxWidth: 280,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontWeight: 'var(--weight-medium)',
                      }}
                      title={doc.title}
                    >
                      {doc.title}
                    </span>
                  </td>
                  <td>
                    <Badge variant={TYPE_BADGE_VARIANT[doc.type] || 'default'}>
                      {doc.type_label}
                    </Badge>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    <span title={doc.description}>{truncate(doc.description, 55)}</span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                    {formatDate(doc.created_at)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        className="btn-icon"
                        title="Xem chi tiết"
                        onClick={() => navigate(`/tai-lieu/${doc.id}`)}
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        className="btn-icon"
                        title="Chỉnh sửa"
                        onClick={() => navigate(`/tai-lieu/${doc.id}/sua`)}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="btn-icon btn-icon-danger"
                        title="Xóa"
                        onClick={() => setDeleteTarget(doc)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Table footer */}
        {!loading && !error && data && data.total > 0 && (
          <div className="table-footer">
            <span className="table-footer-info">
              Hiển thị {(page - 1) * 20 + 1}–{Math.min(page * 20, data.total)} / {data.total} tài liệu
            </span>
            <Pagination
              page={page}
              totalPages={data.totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Xóa tài liệu"
        message={`Bạn có chắc muốn xóa tài liệu "${deleteTarget?.title}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa tài liệu"
      />

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
