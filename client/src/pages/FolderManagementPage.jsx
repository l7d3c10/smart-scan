import { useState, useEffect, useCallback } from 'react';
import {
  Folder,
  FolderPlus,
  FolderOpen,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Trash2,
  Eye,
  Pencil,
  FolderInput,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { documentService } from '../services/document.service.js';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { useToast } from '../hooks/useToast.js';
import { ToastContainer } from '../components/ui/ToastContainer.jsx';
import { DocumentDetailsDrawer } from '../components/documents/DocumentDetailsDrawer.jsx';
import { MoveDocumentModal } from '../components/documents/MoveDocumentModal.jsx';

const DEFAULT_FOLDER_CARDS = [
  { name: 'Tài liệu nội bộ', desc: 'Thư mục lưu trữ tài liệu nội bộ công ty', iconColor: '#2563eb', count: 0 },
  { name: 'Dự án Marketing', desc: 'Các hồ sơ chiến dịch và ấn phẩm truyền thông', iconColor: '#d97706', count: 0 },
  { name: 'Dự án IT & Công nghệ', desc: 'Tài liệu kỹ thuật và kiến trúc hệ thống', iconColor: '#16a34a', count: 0 },
  { name: 'Hợp đồng đối tác 2026', desc: 'Hợp đồng kinh tế và thỏa thuận hợp tác', iconColor: '#9333ea', count: 0 },
  { name: 'Chứng từ tài chính quý 4', desc: 'Hóa đơn và biên lai thanh toán', iconColor: '#dc2626', count: 0 },
];

const TYPE_BADGE_VARIANT = {
  hoa_don:  'danger',
  hop_dong: 'info',
  giay_to:  'success',
  bien_ban: 'warning',
  khac:     'default',
};

export default function FolderManagementPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeFolder = searchParams.get('folder') || '';

  const [folders, setFolders] = useState(DEFAULT_FOLDER_CARDS);
  const [loading, setLoading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  // Documents inside the currently opened folder
  const [folderDocs, setFolderDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [drawerDoc, setDrawerDoc] = useState(null);
  const [moveDoc, setMoveDoc] = useState(null);

  const { toasts, removeToast, success: toastSuccess, error: toastError } = useToast();

  const fetchFolders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await documentService.folders();
      const folderList = Array.isArray(res) ? res : (res?.data || []);
      if (folderList.length > 0) {
        const merged = folderList.map((f, idx) => ({
          name: f.name,
          desc: f.description || `Chứa ${f.count} tài liệu đã phân loại`,
          count: Number(f.count) || 0,
          iconColor: ['#2563eb', '#16a34a', '#d97706', '#9333ea', '#dc2626'][idx % 5],
        }));
        setFolders(merged);
      }
    } catch {
      // Use fallback
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFolderDocuments = useCallback(async (folderName) => {
    if (!folderName) return;
    setDocsLoading(true);
    try {
      const res = await documentService.list({ folderName, limit: 100 });
      const items = res?.items || res?.data?.items || [];
      setFolderDocs(items);
    } catch {
      setFolderDocs([]);
      toastError('Không thể tải danh sách tài liệu trong thư mục.');
    } finally {
      setDocsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  useEffect(() => {
    if (activeFolder) {
      fetchFolderDocuments(activeFolder);
    } else {
      setFolderDocs([]);
    }
  }, [activeFolder, fetchFolderDocuments]);

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    const name = newFolderName.trim();
    if (!name) {
      toastError('Vui lòng nhập tên thư mục.');
      return;
    }
    try {
      await documentService.createFolder({
        name,
        description: newFolderDesc.trim(),
      });
      toastSuccess(`Đã tạo thư mục "${name}" thành công vào Database!`);
      setNewFolderName('');
      setNewFolderDesc('');
      setShowCreate(false);
      fetchFolders();
    } catch (err) {
      toastError(err.message || 'Lỗi khi tạo thư mục vào Database.');
    }
  };

  const handleDeleteFolder = async (e, folderName) => {
    e.stopPropagation();
    if (folderName === 'Tài liệu nội bộ') {
      toastError('Không thể xóa thư mục mặc định của hệ thống.');
      return;
    }
    if (!window.confirm(`Bạn có chắc muốn xóa thư mục "${folderName}"? Các tài liệu trong thư mục này sẽ được đưa về "Tài liệu nội bộ".`)) {
      return;
    }
    try {
      await documentService.deleteFolder(folderName);
      toastSuccess(`Đã xóa thư mục "${folderName}" khỏi Database.`);
      fetchFolders();
    } catch (err) {
      toastError(err.message || 'Xóa thư mục thất bại.');
    }
  };

  const handleOpenFolder = (folderName) => {
    setSearchParams({ folder: folderName });
  };

  const handleBackToFolders = () => {
    setSearchParams({});
    fetchFolders();
  };

  const handleCopyDoc = async (id) => {
    try {
      const newDoc = await documentService.copy(id);
      toastSuccess(`Đã nhân bản tài liệu thành công: ${newDoc.code}`);
      fetchFolderDocuments(activeFolder);
      fetchFolders();
    } catch {
      toastError('Không thể sao chép tài liệu.');
    }
  };

  const handleMoveDoc = async (id, targetFolderName) => {
    try {
      await documentService.moveToFolder(id, targetFolderName);
      toastSuccess(`Đã chuyển tài liệu sang thư mục "${targetFolderName}".`);
      fetchFolderDocuments(activeFolder);
      fetchFolders();
    } catch (err) {
      toastError(err.message || 'Lỗi khi di chuyển tài liệu.');
    }
  };

  // --- VIEW 1: Inside a specific folder ---
  if (activeFolder) {
    const currentFolderMeta = folders.find((f) => f.name === activeFolder);
    return (
      <>
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 4 }}>
              <button
                type="button"
                onClick={handleBackToFolders}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: 'var(--color-primary-600)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--weight-medium)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <ArrowLeft size={15} /> Quản lý thư mục
              </button>
              <span style={{ color: 'var(--text-muted)' }}>/</span>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{activeFolder}</span>
            </div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <FolderOpen size={24} color={currentFolderMeta?.iconColor || 'var(--color-primary-600)'} />
              {activeFolder}
              <span style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 'bold',
                background: 'var(--bg-muted)',
                padding: '2px 10px',
                borderRadius: 'var(--radius-full)',
                color: 'var(--text-secondary)',
              }}>
                {folderDocs.length} tài liệu
              </span>
            </h1>
            {currentFolderMeta?.desc && (
              <p className="page-desc">{currentFolderMeta.desc}</p>
            )}
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={handleBackToFolders}>
              Danh sách thư mục
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={() => fetchFolderDocuments(activeFolder)}
              loading={docsLoading}
            >
              Làm mới
            </Button>
          </div>
        </div>

        <div className="table-container">
          {folderDocs.length === 0 && !docsLoading ? (
            <EmptyState
              icon={FolderOpen}
              title={`Thư mục "${activeFolder}" chưa có tài liệu nào`}
              description="Bạn có thể di chuyển tài liệu từ mục Tất cả tài liệu vào thư mục này."
              action={
                <Button size="sm" variant="secondary" icon={ArrowLeft} onClick={handleBackToFolders}>
                  Quay lại danh sách thư mục
                </Button>
              }
            />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 110 }}>Mã tài liệu</th>
                  <th>Tên tài liệu</th>
                  <th style={{ width: 130 }}>Loại</th>
                  <th style={{ width: 160 }}>Trạng thái ảnh</th>
                  <th style={{ width: 130 }}>Ngày cập nhật</th>
                  <th style={{ width: 150, textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {folderDocs.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>{doc.code}</span>
                    </td>
                    <td>
                      <span
                        style={{ fontWeight: 'var(--weight-medium)', cursor: 'pointer' }}
                        onClick={() => setDrawerDoc(doc)}
                      >
                        {doc.title}
                      </span>
                    </td>
                    <td>
                      <Badge variant={TYPE_BADGE_VARIANT[doc.type] || 'default'}>{doc.type_label}</Badge>
                    </td>
                    <td>
                      {doc.processed_path || doc.original_path ? (
                        <Badge variant="success">Đã có ảnh</Badge>
                      ) : (
                        <Badge variant="default">Chưa có ảnh</Badge>
                      )}
                    </td>
                    <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                      {new Date(doc.updated_at || doc.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <button className="btn-icon" title="Xem chi tiết" onClick={() => setDrawerDoc(doc)}>
                          <Eye size={15} color="var(--color-primary-600)" />
                        </button>
                        <button className="btn-icon" title="Di chuyển thư mục" onClick={() => setMoveDoc(doc)}>
                          <FolderInput size={14} />
                        </button>
                        <button className="btn-icon" title="Chỉnh sửa" onClick={() => navigate(`/tai-lieu/${doc.id}/sua`)}>
                          <Pencil size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <DocumentDetailsDrawer
          doc={drawerDoc}
          isOpen={Boolean(drawerDoc)}
          onClose={() => setDrawerDoc(null)}
          onCopy={handleCopyDoc}
        />

        <MoveDocumentModal
          doc={moveDoc}
          isOpen={Boolean(moveDoc)}
          onClose={() => setMoveDoc(null)}
          onMove={handleMoveDoc}
        />

        <ToastContainer toasts={toasts} onClose={removeToast} />
      </>
    );
  }

  // --- VIEW 2: Folder Grid ---
  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Folder size={24} color="var(--color-primary-600)" /> Quản lý thư mục (Folder Management)
          </h1>
          <p className="page-desc">Tổ chức tài liệu khoa học theo phòng ban, dự án và nhóm chuyên đề</p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="primary" icon={FolderPlus} onClick={() => setShowCreate(true)}>
            Tạo thư mục mới
          </Button>
          <Button variant="secondary" icon={RefreshCw} onClick={fetchFolders} loading={loading}>
            Làm mới
          </Button>
        </div>
      </div>

      {/* Create Folder Form Bar */}
      {showCreate && (
        <form onSubmit={handleCreateFolder} style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--color-primary-300)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4)',
          marginBottom: 'var(--space-5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          boxShadow: 'var(--shadow-md)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <FolderPlus size={20} color="var(--color-primary-600)" />
            <span style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
              Tạo thư mục mới lưu vào Cơ sở dữ liệu:
            </span>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Tên thư mục (ví dụ: Dự án ERP 2026)..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              style={{ flex: 1, minWidth: 240 }}
              autoFocus
              required
            />
            <input
              type="text"
              className="form-control"
              placeholder="Mô tả thư mục (tùy chọn)..."
              value={newFolderDesc}
              onChange={(e) => setNewFolderDesc(e.target.value)}
              style={{ flex: 1.5, minWidth: 280 }}
            />
            <Button variant="primary" size="sm" type="submit">
              Lưu vào Database
            </Button>
            <Button variant="ghost" size="sm" type="button" onClick={() => setShowCreate(false)}>
              Hủy
            </Button>
          </div>
        </form>
      )}

      {/* Grid of Folders */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 'var(--space-5)',
      }}>
        {folders.map((f, i) => (
          <div
            key={i}
            onClick={() => handleOpenFolder(f.name)}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-5)',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.15s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-primary-400)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-default)';
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-md)',
                background: `${f.iconColor}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Folder size={24} color={f.iconColor} />
              </div>

              <span style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 'bold',
                background: 'var(--bg-muted)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                color: 'var(--text-secondary)',
              }}>
                {f.count} tài liệu
              </span>
            </div>

            <div>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'bold', margin: '0 0 4px', color: 'var(--text-primary)' }}>
                {f.name}
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0 }}>
                {f.desc}
              </p>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid var(--border-default)',
              paddingTop: 'var(--space-3)',
              marginTop: 'auto',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-primary-600)',
              fontWeight: 'var(--weight-semibold)',
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                Mở thư mục <ArrowRight size={14} />
              </span>
              {f.name !== 'Tài liệu nội bộ' && (
                <button
                  type="button"
                  className="btn-icon btn-icon-danger"
                  title="Xóa thư mục này khỏi Database"
                  onClick={(e) => handleDeleteFolder(e, f.name)}
                  style={{ width: 26, height: 26 }}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
