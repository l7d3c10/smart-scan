import { useState, useEffect } from 'react';
import { Folder, FolderPlus, ArrowRight, FileText, Plus, RefreshCw } from 'lucide-react';
import { documentService } from '../services/document.service.js';
import { Button } from '../components/ui/Button.jsx';
import { useToast } from '../hooks/useToast.js';
import { ToastContainer } from '../components/ui/ToastContainer.jsx';
import { useNavigate } from 'react-router-dom';

const DEFAULT_FOLDER_CARDS = [
  { name: 'Tài liệu nội bộ', desc: 'Quy định, chính sách và biểu mẫu công ty', iconColor: '#2563eb', count: 12 },
  { name: 'Dự án Marketing', desc: 'Kế hoạch quảng cáo, báo cáo chiến dịch', iconColor: '#d97706', count: 8 },
  { name: 'Dự án IT & Công nghệ', desc: 'Tài liệu kỹ thuật, kiến trúc hệ thống', iconColor: '#16a34a', count: 15 },
  { name: 'Hợp đồng đối tác 2026', desc: 'Hợp đồng kinh tế, biên bản hợp tác', iconColor: '#9333ea', count: 6 },
  { name: 'Chứng từ tài chính quý 4', desc: 'Hóa đơn GTGT, phiếu chi, sao kê', iconColor: '#dc2626', count: 10 },
];

export default function FolderManagementPage() {
  const navigate = useNavigate();
  const [folders, setFolders] = useState(DEFAULT_FOLDER_CARDS);
  const [loading, setLoading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const { toasts, removeToast, success: toastSuccess, error: toastError } = useToast();

  const fetchFolders = async () => {
    setLoading(true);
    try {
      const res = await documentService.folders();
      if (res?.data && res.data.length > 0) {
        const merged = res.data.map((f, idx) => ({
          name: f.name,
          desc: `Chứa ${f.count} tài liệu đã phân loại`,
          count: Number(f.count),
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

  const handleCreateFolder = (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) {
      toastError('Vui lòng nhập tên thư mục.');
      return;
    }
    setFolders([
      ...folders,
      {
        name: newFolderName.trim(),
        desc: 'Thư mục mới tạo (0 tài liệu)',
        count: 0,
        iconColor: '#2563eb',
      },
    ]);
    toastSuccess(`Đã tạo thư mục "${newFolderName.trim()}" thành công!`);
    setNewFolderName('');
    setShowCreate(false);
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
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--color-primary-300)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4)',
          marginBottom: 'var(--space-5)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          boxShadow: 'var(--shadow-md)',
        }}>
          <FolderPlus size={20} color="var(--color-primary-600)" />
          <input
            type="text"
            className="form-control"
            placeholder="Nhập tên thư mục mới (ví dụ: Dự án ERP 2026)..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            style={{ maxWidth: 400 }}
            autoFocus
          />
          <Button variant="primary" size="sm" onClick={handleCreateFolder}>
            Lưu thư mục
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>
            Hủy
          </Button>
        </div>
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
              <span>Mở thư mục</span>
              <ArrowRight size={14} />
            </div>
          </div>
        ))}
      </div>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
