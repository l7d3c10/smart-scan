import { useState, useEffect } from 'react';
import { Star, RefreshCw, Eye, Pencil, Trash2, Copy, FileWarning } from 'lucide-react';
import { documentService } from '../services/document.service.js';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { useToast } from '../hooks/useToast.js';
import { ToastContainer } from '../components/ui/ToastContainer.jsx';
import { DocumentDetailsDrawer } from '../components/documents/DocumentDetailsDrawer.jsx';
import { useNavigate } from 'react-router-dom';

const TYPE_BADGE_VARIANT = {
  hoa_don:  'danger',
  hop_dong: 'info',
  giay_to:  'success',
  bien_ban: 'warning',
  khac:     'default',
};

export default function FavoritesPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerDoc, setDrawerDoc] = useState(null);
  const { toasts, removeToast, success: toastSuccess, error: toastError } = useToast();

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const res = await documentService.list({ isFavorite: true, limit: 50 });
      setDocuments(res?.data?.items || []);
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleToggleFavorite = async (id) => {
    try {
      await documentService.toggleFavorite(id);
      toastSuccess('Đã cập nhật trạng thái yêu thích.');
      fetchFavorites();
    } catch {
      toastError('Thao tác thất bại.');
    }
  };

  const handleCopy = async (id) => {
    try {
      const newDoc = await documentService.copy(id);
      toastSuccess(`Đã nhân bản tài liệu thành công: ${newDoc.code}`);
      fetchFavorites();
    } catch {
      toastError('Không thể sao chép tài liệu.');
    }
  };

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Star size={24} color="#f59e0b" fill="#f59e0b" /> Tài liệu yêu thích (Starred)
          </h1>
          <p className="page-desc">Truy cập nhanh các tài liệu quan trọng đã được bạn đánh dấu sao</p>
        </div>

        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchFavorites} loading={loading}>
          Làm mới
        </Button>
      </div>

      <div className="table-container">
        {documents.length === 0 && !loading ? (
          <EmptyState
            icon={Star}
            title="Chưa có tài liệu yêu thích"
            description="Hãy bấm vào biểu tượng ngôi sao trên bất kỳ tài liệu nào để lưu nhanh vào danh sách này."
            action={<Button size="sm" onClick={() => navigate('/tai-lieu')}>Khám phá danh sách tài liệu</Button>}
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 44, textAlign: 'center' }}>Sao</th>
                <th style={{ width: 110 }}>Mã tài liệu</th>
                <th>Tên tài liệu</th>
                <th style={{ width: 120 }}>Loại</th>
                <th style={{ width: 140 }}>Thư mục</th>
                <th style={{ width: 130 }}>Ngày cập nhật</th>
                <th style={{ width: 140, textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleToggleFavorite(doc.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      title="Bỏ đánh dấu sao"
                    >
                      <Star size={18} color="#f59e0b" fill="#f59e0b" />
                    </button>
                  </td>
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
                  <td style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                    {doc.folder_name || 'Tài liệu nội bộ'}
                  </td>
                  <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    {new Date(doc.updated_at || doc.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                      <button className="btn-icon" title="Xem chi tiết" onClick={() => setDrawerDoc(doc)}>
                        <Eye size={15} color="var(--color-primary-600)" />
                      </button>
                      <button className="btn-icon" title="Sao chép" onClick={() => handleCopy(doc.id)}>
                        <Copy size={14} />
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
        onCopy={handleCopy}
      />

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
