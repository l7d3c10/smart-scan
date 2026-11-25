import { useState, useEffect } from 'react';
import { Folder, FolderPlus, ArrowRight, FileText, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { documentService } from '../services/document.service.js';
import { Button } from '../components/ui/Button.jsx';
import { useToast } from '../hooks/useToast.js';
import { ToastContainer } from '../components/ui/ToastContainer.jsx';
import { useNavigate } from 'react-router-dom';

const DEFAULT_FOLDER_CARDS = [
  { name: 'Tài liệu nội bộ', desc: 'Thư mục lưu trữ tài liệu nội bộ công ty', iconColor: '#2563eb', count: 0 },
  { name: 'Dự án Marketing', desc: 'Các hồ sơ chiến dịch và ấn phẩm truyền thông', iconColor: '#d97706', count: 0 },
  { name: 'Dự án IT & Công nghệ', desc: 'Tài liệu kỹ thuật và kiến trúc hệ thống', iconColor: '#16a34a', count: 0 },
  { name: 'Hợp đồng đối tác 2026', desc: 'Hợp đồng kinh tế và thỏa thuận hợp tác', iconColor: '#9333ea', count: 0 },
  { name: 'Chứng từ tài chính quý 4', desc: 'Hóa đơn và biên lai thanh toán', iconColor: '#dc2626', count: 0 },
];

export default function FolderManagementPage() {
  const navigate = useNavigate();
  const [folders, setFolders] = useState(DEFAULT_FOLDER_CARDS);
  const [loading, setLoading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const { toasts, removeToast, success: toastSuccess, error: toastError } = useToast();

  const fetchFolders = async () => {
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
  };

  useEffect(() => {
    fetchFolders();
  }, []);

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
    navigate(`/tai-lieu?folderName=${encodeURIComponent(folderName)}`);
  };

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
