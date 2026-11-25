import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus, RefreshCw, Eye, Pencil, Trash2, Copy,
  FileWarning, AlertCircle, Sparkles, ChevronDown,
  SlidersHorizontal, HelpCircle, CheckSquare, Square,
  ArrowUpDown, ArrowUp, ArrowDown, FileSpreadsheet,
  LayoutList, LayoutGrid, FileText, Download, Folder,
  Receipt, FileCheck, FileSignature, FileSpreadsheet as FileReport, Files,
  Star, Share2, History, FolderInput
} from 'lucide-react';
import { useDocuments } from '../hooks/useDocuments.js';
import { useToast } from '../hooks/useToast.js';
import { documentService } from '../services/document.service.js';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { SearchInput } from '../components/ui/SearchInput.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { SkeletonRow } from '../components/ui/Skeleton.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';
import { ToastContainer } from '../components/ui/ToastContainer.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { DocumentDetailsDrawer } from '../components/documents/DocumentDetailsDrawer.jsx';
import { DocumentQuickViewModal } from '../components/documents/DocumentQuickViewModal.jsx';
import { ShareDocumentModal } from '../components/documents/ShareDocumentModal.jsx';
import { MoveDocumentModal } from '../components/documents/MoveDocumentModal.jsx';
import { VersionHistoryModal } from '../components/documents/VersionHistoryModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';

/* ── Constants ── */
const CATEGORY_ITEMS = [
  { key: '',         label: 'Tất cả tài liệu',   icon: Files,           color: 'var(--color-primary-600)' },
  { key: 'hoa_don',  label: 'Hóa đơn tài chính', icon: Receipt,         color: '#dc2626' },
  { key: 'hop_dong', label: 'Hợp đồng kinh tế',  icon: FileSignature,   color: '#2563eb' },
  { key: 'giay_to',  label: 'Giấy tờ pháp lý',   icon: FileCheck,       color: '#16a34a' },
  { key: 'bien_ban', label: 'Biên bản làm việc', icon: FileReport,      color: '#9333ea' },
  { key: 'khac',     label: 'Tài liệu khác',     icon: FileText,        color: '#64748b' },
];

const LIMIT_OPTIONS = [
  { value: 10, label: '10 dòng / trang' },
  { value: 15, label: '15 dòng / trang' },
  { value: 20, label: '20 dòng / trang' },
];

const TYPE_BADGE_VARIANT = {
  hoa_don:  'danger',
  hop_dong: 'info',
  giay_to:  'success',
  bien_ban: 'warning',
  khac:     'default',
};

const TYPE_SHORT_LABEL = {
  hoa_don:  'HD',
  hop_dong: 'HĐ',
  giay_to:  'GT',
  bien_ban: 'BB',
  khac:     'TL',
};

const DEFAULT_COLUMNS = {
  code: true,
  title: true,
  type: true,
  description: true,
  owner: true,
  status: true,
  createdAt: true,
  actions: true,
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

export default function DocumentListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // View mode: Table vs Grid (DocManage proposal)
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('smartscan_view_mode') || 'table';
  });

  const handleSetViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem('smartscan_view_mode', mode);
  };

  // Filter state
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [search, setSearch]           = useState(searchParams.get('search') || '');
  const [type, setType]               = useState(searchParams.get('type') || '');
  const [sort, setSort]               = useState(searchParams.get('sort') || 'created_at_desc');
  const [page, setPage]               = useState(Number(searchParams.get('page')) || 1);
  const [limit, setLimit]             = useState(Number(searchParams.get('limit')) || 10);

  // Column visibility
  const [columns, setColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('smartscan_doc_columns');
      return saved ? { ...DEFAULT_COLUMNS, ...JSON.parse(saved) } : DEFAULT_COLUMNS;
    } catch {
      return DEFAULT_COLUMNS;
    }
  });
  const [showColMenu, setShowColMenu] = useState(false);

  // Selection state
  const [selectedIds, setSelectedIds] = useState([]);

  // Right Drawer Details & Action Modals state
  const [drawerDoc, setDrawerDoc]       = useState(null);
  const [quickViewDoc, setQuickViewDoc] = useState(null);
  const [shareDoc, setShareDoc]         = useState(null);
  const [moveDoc, setMoveDoc]           = useState(null);
  const [versionDoc, setVersionDoc]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // single doc or 'bulk'
  const [deleting, setDeleting]         = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const searchInputRef = useRef(null);
  const { toasts, removeToast, success: toastSuccess, error: toastError } = useToast();

  const handleToggleFavorite = async (docId, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await documentService.toggleFavorite(docId);
      toastSuccess(res.is_favorite ? 'Đã thêm vào danh sách Yêu thích ⭐' : 'Đã bỏ khỏi danh sách Yêu thích');
      refetch();
    } catch (err) {
      toastError(err.message || 'Lỗi cập nhật yêu thích');
    }
  };

  const handleMoveDocument = async (id, folderName) => {
    try {
      if (moveDoc?.bulkIds?.length) {
        await Promise.all(moveDoc.bulkIds.map((docId) => documentService.moveToFolder(docId, folderName)));
        toastSuccess(`Đã chuyển ${moveDoc.bulkIds.length} tài liệu vào thư mục "${folderName}"!`);
        setSelectedIds([]);
      } else {
        await documentService.moveToFolder(id, folderName);
        toastSuccess(`Đã chuyển tài liệu vào thư mục "${folderName}"!`);
      }
      refetch();
    } catch (err) {
      toastError(err.message || 'Lỗi khi di chuyển tài liệu');
    }
  };

  // Debounce search
  const debounceRef = useRef(null);
  const handleSearchInput = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 250);
  };

  // Sync URL
  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (type) params.type = type;
    if (sort !== 'created_at_desc') params.sort = sort;
    if (page > 1) params.page = page;
    if (limit !== 10) params.limit = limit;
    setSearchParams(params, { replace: true });
  }, [search, type, sort, page, limit, setSearchParams]);

  const toggleColumn = (colKey) => {
    setColumns((prev) => {
      const next = { ...prev, [colKey]: !prev[colKey] };
      localStorage.setItem('smartscan_doc_columns', JSON.stringify(next));
      return next;
    });
  };

  // Fetch documents
  const { data, loading, error, refetch } = useDocuments({ search, type, page, limit, sort });

  // Clear selections on page changes
  useEffect(() => {
    setSelectedIds([]);
  }, [page, search, type]);

  // Selection handlers
  const allIdsOnPage = useMemo(() => (data?.items || []).map((d) => d.id), [data]);
  const isAllSelected = allIdsOnPage.length > 0 && allIdsOnPage.every((id) => selectedIds.includes(id));

  const toggleSelectAll = () => {
    if (isAllSelected) setSelectedIds([]);
    else setSelectedIds(allIdsOnPage);
  };

  const toggleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Sort toggle helper
  const handleSortHeader = (col) => {
    let newSort = `${col}_asc`;
    if (sort === `${col}_asc`) newSort = `${col}_desc`;
    else if (sort === `${col}_desc`) newSort = 'created_at_desc';
    setSort(newSort);
    setPage(1);
  };

  const getSortIcon = (col) => {
    if (sort === `${col}_asc`) return <ArrowUp size={14} style={{ color: 'var(--color-primary-600)' }} />;
    if (sort === `${col}_desc`) return <ArrowDown size={14} style={{ color: 'var(--color-primary-600)' }} />;
    return <ArrowUpDown size={13} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />;
  };

  // Copy handlers
  const handleCopySingle = async (id) => {
    try {
      const newDoc = await documentService.copy(id);
      toastSuccess(`Đã nhân bản tài liệu thành công: ${newDoc.code}`);
      refetch();
    } catch {
      toastError('Không thể sao chép tài liệu. Vui lòng thử lại.');
    }
  };

  const handleBulkCopy = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await documentService.bulkCopy(selectedIds);
      toastSuccess(`Đã sao chép thành công ${res.count || selectedIds.length} tài liệu.`);
      setSelectedIds([]);
      refetch();
    } catch {
      toastError('Sao chép hàng loạt thất bại.');
    }
  };

  // Delete handlers
  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      if (deleteTarget === 'bulk') {
        const res = await documentService.bulkDelete(selectedIds);
        toastSuccess(`Đã xóa ${res.deletedCount || selectedIds.length} tài liệu.`);
        setSelectedIds([]);
      } else if (deleteTarget) {
        await documentService.delete(deleteTarget.id);
        toastSuccess(`Đã xóa tài liệu "${deleteTarget.title}".`);
        setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
      }
      setDeleteTarget(null);
      refetch();
    } catch {
      toastError('Xóa tài liệu thất bại.');
    } finally {
      setDeleting(false);
    }
  };

  // Global Keyboard shortcuts: Ctrl+K, /, N, E, Delete, ?
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 1. Ctrl + K to focus search (works even inside inputs)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        const input = searchInputRef.current || document.getElementById('global-search-input');
        if (input) {
          input.focus();
          input.select();
        }
        return;
      }

      // 2. Escape closes modals / drawers and blurs inputs
      if (e.key === 'Escape') {
        const active = document.activeElement;
        if (active && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName)) {
          active.blur();
        }
        setDrawerDoc(null);
        setShowShortcuts(false);
        setDeleteTarget(null);
        return;
      }

      // If user is currently typing inside an input/textarea, do not intercept normal typing keys
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        return;
      }

      // 3. Key 'N': Navigate to Create
      if (!e.ctrlKey && !e.altKey && !e.metaKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        navigate('/tai-lieu/them');
        return;
      }

      // 4. Key 'E': Edit selected document
      if (!e.ctrlKey && !e.altKey && !e.metaKey && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        if (selectedIds.length === 1) {
          navigate(`/tai-lieu/${selectedIds[0]}/sua`);
        } else if (selectedIds.length > 1) {
          toastError('Phím tắt E: Bạn đang chọn nhiều tài liệu. Vui lòng chỉ chọn 1 tài liệu để sửa.');
        } else {
          toastError('Phím tắt E: Vui lòng tích chọn ô checkbox của 1 tài liệu trước khi bấm E.');
        }
        return;
      }

      // 5. Key 'Delete': Delete selected documents
      if (e.key === 'Delete') {
        e.preventDefault();
        if (selectedIds.length > 0) {
          setDeleteTarget('bulk');
        } else {
          toastError('Phím tắt Delete: Vui lòng tích chọn ít nhất 1 tài liệu để xóa.');
        }
        return;
      }

      // 6. Key '/': Focus search input
      if (!e.ctrlKey && !e.altKey && !e.metaKey && e.key === '/') {
        e.preventDefault();
        const input = searchInputRef.current || document.getElementById('global-search-input');
        if (input) {
          input.focus();
          input.select();
        }
        return;
      }

      // 7. Key '?': Toggle shortcuts help modal
      if (e.key === '?' || (e.shiftKey && (e.key === '/' || e.code === 'Slash'))) {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, navigate, toastError]);

  const hasFilter = search || type;

  const handleResetFilter = () => {
    setSearchInput('');
    setSearch('');
    setType('');
    setSort('created_at_desc');
    setPage(1);
  };

  return (
    <>
      {/* Page Header with DocManage DMS layout */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div className="page-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <h1 className="page-title" style={{ margin: 0 }}>Quản lý tài liệu chi tiết</h1>
            <span style={{
              fontSize: 'var(--text-xs)',
              background: 'var(--color-primary-100)',
              color: 'var(--color-primary-700)',
              fontWeight: 'var(--weight-semibold)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)'
            }}>
              {data?.total ?? 0} bản ghi
            </span>
          </div>
          <p className="page-desc" style={{ marginTop: 'var(--space-1)', color: 'var(--text-secondary)' }}>
            Lưu trữ · Sắp xếp · Tra cứu thông minh · Phân quyền an toàn
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          {/* Table / Grid view switcher */}
          <div className="view-mode-toggle">
            <button
              type="button"
              className={`view-mode-btn${viewMode === 'table' ? ' active' : ''}`}
              onClick={() => handleSetViewMode('table')}
              title="Dạng bảng (Table View)"
            >
              <LayoutList size={16} />
            </button>
            <button
              type="button"
              className={`view-mode-btn${viewMode === 'grid' ? ' active' : ''}`}
              onClick={() => handleSetViewMode('grid')}
              title="Dạng lưới thẻ (Grid View)"
            >
              <LayoutGrid size={16} />
            </button>
          </div>

          <Button
            variant="secondary"
            icon={FileSpreadsheet}
            onClick={() => navigate('/tai-lieu/nhap')}
          >
            Nhập Excel / JSON
          </Button>

          <Button
            variant="primary"
            icon={Plus}
            onClick={() => navigate('/tai-lieu/them')}
          >
            Thêm tài liệu (N)
          </Button>

          <button
            className="btn-icon"
            onClick={() => setShowShortcuts(true)}
            title="Xem danh sách phím tắt (?)"
            aria-label="Phím tắt"
            style={{ width: 34, height: 34 }}
          >
            <HelpCircle size={17} />
          </button>
        </div>
      </div>

      {/* Main Container: Sub-Sidebar on Left + Content on Right (DocManage Layout) */}
      <div style={{ display: 'grid', gridTemplateColumns: '230px 1fr', gap: 'var(--space-5)', alignItems: 'start' }}>

        {/* ── Left Category Sub-Sidebar ── */}
        <div className="table-container" style={{ padding: 'var(--space-3)', background: 'var(--bg-surface)' }}>
          <div style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--weight-bold)',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: 'var(--space-2) var(--space-3)',
            marginBottom: 'var(--space-1)',
          }}>
            Phân loại tài liệu
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {CATEGORY_ITEMS.map((cat) => {
              const isActive = type === cat.key;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => { setType(cat.key); setPage(1); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: isActive ? 'var(--color-primary-50)' : 'transparent',
                    color: isActive ? 'var(--color-primary-700)' : 'var(--text-primary)',
                    fontWeight: isActive ? 'var(--weight-semibold)' : 'var(--weight-normal)',
                    cursor: 'pointer',
                    fontSize: 'var(--text-sm)',
                    textAlign: 'left',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon size={16} color={isActive ? 'var(--color-primary-600)' : cat.color} />
                    <span>{cat.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div style={{
            borderTop: '1px solid var(--border-default)',
            margin: 'var(--space-3) 0 var(--space-2)',
            paddingTop: 'var(--space-3)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            paddingLeft: 'var(--space-3)',
          }}>
            Phím tắt nhanh:
            <div style={{ marginTop: 4, display: 'flex', gap: 4 }}>
              <kbd style={{ background: 'var(--bg-muted)', padding: '1px 5px', borderRadius: 2 }}>Ctrl K</kbd> tìm kiếm
            </div>
          </div>
        </div>

        {/* ── Right Content Area ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', minWidth: 0 }}>

          {/* AI Search & Keyword Suggestions Banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-2) var(--space-4)',
            background: 'var(--color-primary-50)',
            border: '1px solid var(--color-primary-200)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-xs)',
            flexWrap: 'wrap',
            gap: 'var(--space-2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Sparkles size={15} color="var(--color-primary-600)" />
              <span style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--color-primary-800)' }}>
                Tìm kiếm Keyword:
              </span>
              <span style={{ color: 'var(--color-primary-700)' }}>
                Tự động tách token trên Mã, Tiêu đề, Loại, Nội dung mô tả.
              </span>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              {['Hóa đơn', 'Hợp đồng', 'Biên bản', 'Đã sao chép'].map((keyword) => (
                <button
                  key={keyword}
                  type="button"
                  onClick={() => {
                    setSearchInput(keyword);
                    setSearch(keyword);
                    setPage(1);
                  }}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--color-primary-200)',
                    color: 'var(--color-primary-700)',
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    cursor: 'pointer',
                  }}
                >
                  #{keyword}
                </button>
              ))}
            </div>
          </div>

          {/* Toolbar with Search, Limit & Column toggles */}
          <div className="toolbar" style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 240px', minWidth: 200, position: 'relative' }}>
              <SearchInput
                ref={searchInputRef}
                placeholder="Tìm kiếm tài liệu... (Ctrl + K hoặc /)"
                value={searchInput}
                onChange={handleSearchInput}
              />
              <span className="search-kbd-badge">Ctrl K</span>
            </div>

            {/* Rows per page selector with Custom Downward Arrow */}
            <div style={{ position: 'relative', width: 150 }}>
              <select
                className="form-control form-select"
                style={{ width: '100%', paddingRight: 32, appearance: 'none', cursor: 'pointer' }}
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
              >
                {LIMIT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown
                size={16}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: 'var(--text-muted)'
                }}
              />
            </div>

            {/* Column toggle dropdown (Table View) */}
            {viewMode === 'table' && (
              <div style={{ position: 'relative' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={SlidersHorizontal}
                  onClick={() => setShowColMenu((prev) => !prev)}
                  title="Cấu hình ẩn/hiện cột"
                >
                  Cột
                </Button>

                {showColMenu && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 6,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 30,
                    padding: 'var(--space-2) var(--space-3)',
                    minWidth: 180,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-2)'
                  }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-default)', paddingBottom: 4 }}>
                      BẬT / TẮT CỘT
                    </span>
                    {[
                      { key: 'code', label: 'Mã tài liệu' },
                      { key: 'title', label: 'Tiêu đề' },
                      { key: 'type', label: 'Loại tài liệu' },
                      { key: 'description', label: 'Mô tả' },
                      { key: 'owner', label: 'Người sở hữu' },
                      { key: 'status', label: 'Trạng thái xử lý' },
                      { key: 'createdAt', label: 'Ngày tạo' },
                    ].map(({ key, label }) => (
                      <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={columns[key]}
                          onChange={() => toggleColumn(key)}
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {hasFilter && (
              <Button variant="ghost" size="sm" onClick={handleResetFilter}>
                Đặt lại
              </Button>
            )}

            <button
              className="btn-icon"
              onClick={refetch}
              title="Làm mới dữ liệu"
              aria-label="Làm mới"
              style={{ width: 34, height: 34 }}
            >
              <RefreshCw size={15} />
            </button>
          </div>

          {/* Floating Bulk Actions Bar */}
          {selectedIds.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--color-primary-700)',
              color: 'var(--color-white)',
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>
                  ✓ Đã chọn {selectedIds.length} tài liệu
                </span>
                <button
                  onClick={() => setSelectedIds([])}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    color: '#fff',
                    fontSize: 'var(--text-xs)',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer'
                  }}
                >
                  Bỏ chọn
                </button>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={FolderInput}
                  onClick={() => setMoveDoc({ id: selectedIds[0], bulkIds: selectedIds, title: `${selectedIds.length} tài liệu đã chọn` })}
                  style={{ background: '#fff', color: 'var(--color-primary-800)' }}
                >
                  Di chuyển ({selectedIds.length})
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Copy}
                  onClick={handleBulkCopy}
                  style={{ background: '#fff', color: 'var(--color-primary-800)' }}
                >
                  Sao chép {selectedIds.length} bản ghi
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  onClick={() => setDeleteTarget('bulk')}
                >
                  Xóa {selectedIds.length} bản ghi (Delete)
                </Button>
              </div>
            </div>
          )}

          {/* ── View Mode: GRID VIEW ── */}
          {viewMode === 'grid' && (
            <>
              {loading && (
                <div className="doc-grid">
                  {Array.from({ length: limit }).map((_, i) => (
                    <div key={i} className="doc-card" style={{ minHeight: 180 }}>
                      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                        <div style={{ width: 40, height: 40, background: 'var(--bg-muted)', borderRadius: 'var(--radius-md)' }} />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ width: '60%', height: 14, background: 'var(--bg-muted)', borderRadius: 2 }} />
                          <div style={{ width: '90%', height: 16, background: 'var(--bg-muted)', borderRadius: 2 }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && !error && data?.items?.length === 0 && (
                <EmptyState
                  icon={FileWarning}
                  title="Không tìm thấy tài liệu nào"
                  description={hasFilter ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.' : 'Chưa có tài liệu nào. Hãy thêm tài liệu đầu tiên.'}
                  action={
                    hasFilter
                      ? <Button size="sm" variant="secondary" onClick={handleResetFilter}>Xóa bộ lọc</Button>
                      : <Button size="sm" icon={Plus} onClick={() => navigate('/tai-lieu/them')}>Thêm tài liệu</Button>
                  }
                />
              )}

              {!loading && !error && (
                <div className="doc-grid">
                  {data?.items?.map((doc) => {
                    const isSelected = selectedIds.includes(doc.id);
                    return (
                      <div
                        key={doc.id}
                        className={`doc-card${isSelected ? ' selected' : ''}`}
                      >
                        <div className="doc-card-header">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <button
                              type="button"
                              onClick={() => toggleSelectRow(doc.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            >
                              {isSelected ? <CheckSquare size={16} color="var(--color-primary-600)" /> : <Square size={16} color="var(--text-muted)" />}
                            </button>
                            <div className={`doc-card-type-icon ${doc.type}`}>
                              {TYPE_SHORT_LABEL[doc.type] || 'TL'}
                            </div>
                            <div>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                {doc.code}
                              </span>
                              <div>
                                <Badge variant={TYPE_BADGE_VARIANT[doc.type] || 'default'}>
                                  {doc.type_label}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <button
                              className="btn-icon"
                              title={doc.is_favorite ? 'Bỏ yêu thích' : 'Đánh dấu yêu thích'}
                              onClick={(e) => handleToggleFavorite(doc.id, e)}
                            >
                              <Star size={13} fill={doc.is_favorite ? '#f59e0b' : 'none'} color={doc.is_favorite ? '#f59e0b' : 'var(--text-muted)'} />
                            </button>
                            <button
                              className="btn-icon"
                              title="Xem tổng quan thông tin chính"
                              onClick={() => setQuickViewDoc(doc)}
                            >
                              <Sparkles size={13} color="var(--color-primary-600)" />
                            </button>
                            <button
                              className="btn-icon"
                              title="Xem chi tiết (Drawer)"
                              onClick={() => setDrawerDoc(doc)}
                            >
                              <Eye size={13} color="var(--text-secondary)" />
                            </button>
                            <button
                              className="btn-icon"
                              title="Chia sẻ tài liệu"
                              onClick={() => setShareDoc(doc)}
                            >
                              <Share2 size={13} />
                            </button>
                            <button
                              className="btn-icon"
                              title="Di chuyển thư mục"
                              onClick={() => setMoveDoc(doc)}
                            >
                              <FolderInput size={13} />
                            </button>
                            <button
                              className="btn-icon"
                              title="Lịch sử phiên bản"
                              onClick={() => setVersionDoc(doc)}
                            >
                              <History size={13} />
                            </button>
                            <button
                              className="btn-icon"
                              title="Sao chép"
                              onClick={() => handleCopySingle(doc.id)}
                            >
                              <Copy size={13} />
                            </button>
                            <button
                              className="btn-icon"
                              title="Chỉnh sửa"
                              onClick={() => navigate(`/tai-lieu/${doc.id}/sua`)}
                            >
                              <Pencil size={13} />
                            </button>
                          </div>
                        </div>

                        <div className="doc-card-body">
                          <h4
                            className="doc-card-title"
                            title={doc.title}
                            onClick={() => setDrawerDoc(doc)}
                          >
                            {doc.title}
                          </h4>

                          {doc.is_copy && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                              fontSize: '10px',
                              fontWeight: 'var(--weight-semibold)',
                              color: 'var(--color-primary-700)',
                              background: 'var(--color-primary-100)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '1px 5px',
                              width: 'fit-content'
                            }}>
                              📋 Đã sao chép
                            </span>
                          )}

                          <p className="doc-card-desc">
                            {doc.description || 'Chưa có mô tả chi tiết.'}
                          </p>
                        </div>

                        <div className="doc-card-footer">
                          <span>{doc.owner_username || `#${doc.owner_id}`}</span>
                          <span>{formatDate(doc.created_at)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ── View Mode: TABLE VIEW ── */}
          {viewMode === 'table' && (
            <div className="table-container" style={{ position: 'relative' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 40, textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        title={isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả trang này'}
                      >
                        {isAllSelected ? <CheckSquare size={16} color="var(--color-primary-600)" /> : <Square size={16} color="var(--text-muted)" />}
                      </button>
                    </th>

                    {columns.code && (
                      <th
                        style={{ width: 105, cursor: 'pointer' }}
                        onClick={() => handleSortHeader('code')}
                        title="Nhấn để sắp xếp theo Mã"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span>Mã</span> {getSortIcon('code')}
                        </div>
                      </th>
                    )}

                    {columns.title && (
                      <th
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSortHeader('title')}
                        title="Nhấn để sắp xếp theo Tên"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span>Tên tài liệu</span> {getSortIcon('title')}
                        </div>
                      </th>
                    )}

                    {columns.type && (
                      <th
                        style={{ width: 110, cursor: 'pointer' }}
                        onClick={() => handleSortHeader('type')}
                        title="Nhấn để sắp xếp theo Loại"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span>Loại</span> {getSortIcon('type')}
                        </div>
                      </th>
                    )}

                    {columns.description && (
                      <th style={{ width: 180 }}>Mô tả</th>
                    )}

                    {columns.owner && (
                      <th style={{ width: 120 }}>Người sở hữu</th>
                    )}

                    {columns.status && (
                      <th style={{ width: 110 }}>Trạng thái ảnh</th>
                    )}

                    {columns.createdAt && (
                      <th
                        style={{ width: 115, cursor: 'pointer' }}
                        onClick={() => handleSortHeader('created_at')}
                        title="Nhấn để sắp xếp theo Ngày tạo"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span>Ngày tạo</span> {getSortIcon('created_at')}
                        </div>
                      </th>
                    )}

                    {columns.actions && (
                      <th style={{ width: 130, textAlign: 'center' }}>Thao tác</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {loading && Array.from({ length: limit }).map((_, i) => <SkeletonRow key={i} cols={8} />)}

                  {!loading && error && (
                    <tr>
                      <td colSpan={9}>
                        <EmptyState
                          icon={AlertCircle}
                          title="Không thể tải dữ liệu"
                          description={error.message || 'Lỗi kết nối đến máy chủ.'}
                          action={<Button size="sm" onClick={refetch}>Thử lại</Button>}
                        />
                      </td>
                    </tr>
                  )}

                  {!loading && !error && data?.items?.length === 0 && (
                    <tr>
                      <td colSpan={9}>
                        <EmptyState
                          icon={FileWarning}
                          title="Không tìm thấy tài liệu nào"
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

                  {!loading && !error && data?.items?.map((doc) => {
                    const isSelected = selectedIds.includes(doc.id);
                    return (
                      <tr
                        key={doc.id}
                        style={{
                          backgroundColor: isSelected ? 'var(--color-primary-50)' : undefined,
                          transition: 'background-color 0.1s ease',
                        }}
                      >
                        {/* Checkbox */}
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => toggleSelectRow(doc.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            {isSelected ? <CheckSquare size={16} color="var(--color-primary-600)" /> : <Square size={16} color="var(--text-muted)" />}
                          </button>
                        </td>

                        {/* Code */}
                        {columns.code && (
                          <td>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 'var(--weight-semibold)' }}>
                              {doc.code}
                            </span>
                          </td>
                        )}

                        {/* Title & Copy Badge */}
                        {columns.title && (
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                              <span
                                style={{
                                  maxWidth: 260,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  fontWeight: 'var(--weight-medium)',
                                  color: 'var(--text-primary)',
                                  cursor: 'pointer'
                                }}
                                onClick={() => setDrawerDoc(doc)}
                                title={`Bấm để mở xem chi tiết: ${doc.title}`}
                              >
                                {doc.title}
                              </span>

                              {doc.is_copy && (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 3,
                                  fontSize: '10px',
                                  fontWeight: 'var(--weight-semibold)',
                                  color: 'var(--color-primary-700)',
                                  background: 'var(--color-primary-100)',
                                  borderRadius: 'var(--radius-sm)',
                                  padding: '1px 5px',
                                  width: 'fit-content'
                                }}>
                                  📋 Đã sao chép
                                </span>
                              )}
                            </div>
                          </td>
                        )}

                        {/* Type */}
                        {columns.type && (
                          <td>
                            <Badge variant={TYPE_BADGE_VARIANT[doc.type] || 'default'}>
                              {doc.type_label}
                            </Badge>
                          </td>
                        )}

                        {/* Description */}
                        {columns.description && (
                          <td style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                            <span title={doc.description}>{truncate(doc.description, 35)}</span>
                          </td>
                        )}

                        {/* Owner */}
                        {columns.owner && (
                          <td style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                            {doc.owner_username || `#${doc.owner_id}`}
                          </td>
                        )}

                        {/* Status */}
                        {columns.status && (
                          <td>
                            <span style={{
                              fontSize: 'var(--text-xs)',
                              padding: '2px 6px',
                              borderRadius: 'var(--radius-sm)',
                              fontWeight: 'var(--weight-medium)',
                              background: doc.processed_path ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
                              color: doc.processed_path ? 'var(--color-success-text)' : 'var(--color-warning-text)',
                              border: `1px solid ${doc.processed_path ? 'var(--color-success-border)' : 'var(--color-warning-border)'}`
                            }}>
                              {doc.processed_path ? '✓ Đã xử lý' : 'Chưa xử lý'}
                            </span>
                          </td>
                        )}

                        {/* Created At */}
                        {columns.createdAt && (
                          <td style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                            {formatDate(doc.created_at)}
                          </td>
                        )}

                        {/* Actions */}
                        {columns.actions && (
                          <td>
                            <div style={{ display: 'flex', gap: 4, justifyContent: 'center', alignItems: 'center' }}>
                              <button
                                className="btn-icon"
                                title={doc.is_favorite ? 'Bỏ yêu thích' : 'Đánh dấu yêu thích'}
                                onClick={(e) => handleToggleFavorite(doc.id, e)}
                              >
                                <Star size={14} fill={doc.is_favorite ? '#f59e0b' : 'none'} color={doc.is_favorite ? '#f59e0b' : 'var(--text-muted)'} />
                              </button>

                              <button
                                className="btn-icon"
                                title="Xem tổng quan thông tin chính"
                                onClick={() => setQuickViewDoc(doc)}
                              >
                                <Sparkles size={14} color="var(--color-primary-600)" />
                              </button>

                              <button
                                className="btn-icon"
                                title="Xem chi tiết (Right Drawer)"
                                onClick={() => setDrawerDoc(doc)}
                              >
                                <Eye size={14} color="var(--text-secondary)" />
                              </button>

                              <button
                                className="btn-icon"
                                title="Chia sẻ tài liệu"
                                onClick={() => setShareDoc(doc)}
                              >
                                <Share2 size={14} />
                              </button>

                              <button
                                className="btn-icon"
                                title="Di chuyển thư mục"
                                onClick={() => setMoveDoc(doc)}
                              >
                                <FolderInput size={14} />
                              </button>

                              <button
                                className="btn-icon"
                                title="Lịch sử phiên bản"
                                onClick={() => setVersionDoc(doc)}
                              >
                                <History size={14} />
                              </button>

                              <button
                                className="btn-icon"
                                title="Sao chép bản ghi này"
                                onClick={() => handleCopySingle(doc.id)}
                              >
                                <Copy size={14} />
                              </button>

                              <button
                                className="btn-icon"
                                title="Chỉnh sửa (E)"
                                onClick={() => navigate(`/tai-lieu/${doc.id}/sua`)}
                              >
                                <Pencil size={14} />
                              </button>

                              <button
                                className="btn-icon btn-icon-danger"
                                title="Xóa tài liệu"
                                onClick={() => setDeleteTarget(doc)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table / Grid footer */}
          {!loading && !error && data && data.total > 0 && (
            <div className="table-footer" style={{ marginTop: 'var(--space-2)' }}>
              <span className="table-footer-info">
                Hiển thị {(page - 1) * limit + 1}–{Math.min(page * limit, data.total)} trong tổng số {data.total} tài liệu
              </span>
              <Pagination
                page={page}
                totalPages={data.totalPages}
                onPageChange={setPage}
              />
            </div>
          )}

        </div>
      </div>

      {/* Right Drawer: Document Details (DocManage Màn hình 6 & 7) */}
      <DocumentDetailsDrawer
        doc={drawerDoc}
        isOpen={Boolean(drawerDoc)}
        onClose={() => setDrawerDoc(null)}
        onCopy={handleCopySingle}
      />

      {/* Quick View Modal (Xem tổng quan thông tin chính) */}
      <DocumentQuickViewModal
        doc={quickViewDoc}
        isOpen={Boolean(quickViewDoc)}
        onClose={() => setQuickViewDoc(null)}
        onCopy={handleCopySingle}
      />

      {/* Share Document Modal (Màn 12 & 13) */}
      <ShareDocumentModal
        doc={shareDoc}
        isOpen={Boolean(shareDoc)}
        onClose={() => setShareDoc(null)}
      />

      {/* Move Document Modal (Màn 11) */}
      <MoveDocumentModal
        doc={moveDoc}
        isOpen={Boolean(moveDoc)}
        onClose={() => setMoveDoc(null)}
        onMove={handleMoveDocument}
      />

      {/* Version History Modal (Màn 14) */}
      <VersionHistoryModal
        doc={versionDoc}
        isOpen={Boolean(versionDoc)}
        onClose={() => setVersionDoc(null)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title={deleteTarget === 'bulk' ? `Xóa ${selectedIds.length} tài liệu đã chọn` : 'Xóa tài liệu'}
        message={
          deleteTarget === 'bulk'
            ? `Bạn có chắc chắn muốn xóa ${selectedIds.length} tài liệu đã chọn không? Thao tác này sẽ không thể khôi phục.`
            : `Bạn có chắc muốn xóa tài liệu "${deleteTarget?.title}"? Hành động này không thể hoàn tác.`
        }
        confirmLabel={deleteTarget === 'bulk' ? `Xóa ${selectedIds.length} bản ghi` : 'Xóa tài liệu'}
      />

      {/* Keyboard Shortcuts Help Modal */}
      <Modal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        title="Bảng phím tắt điều hướng nhanh"
        size="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
          {[
            { key: 'Ctrl + K', desc: 'Nhảy nhanh vào ô tìm kiếm toàn diện' },
            { key: 'N', desc: 'Thêm mới tài liệu' },
            { key: 'E', desc: 'Chỉnh sửa tài liệu đang chọn' },
            { key: 'Delete', desc: 'Xóa các tài liệu đang chọn' },
            { key: '/', desc: 'Nhảy nhanh vào ô tìm kiếm' },
            { key: '?', desc: 'Mở / đóng bảng phím tắt này' },
            { key: 'Esc', desc: 'Đóng cửa sổ xem nhanh / modal' },
          ].map(({ key, desc }) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-default)' }}>
              <span>{desc}</span>
              <kbd style={{
                background: 'var(--bg-muted)',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-sm)',
                padding: '2px 8px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 'bold',
                color: 'var(--text-primary)',
              }}>
                {key}
              </kbd>
            </div>
          ))}
        </div>
      </Modal>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
