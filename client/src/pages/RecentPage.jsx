import { useState, useEffect } from 'react';
import { Clock, RefreshCw, Eye, Pencil, Copy, FileText, ArrowRight } from 'lucide-react';
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

function timeAgo(dateString) {
  if (!dateString) return 'Gần đây';
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Hôm qua';
  return `${days} ngày trước`;
}

export default function RecentPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerDoc, setDrawerDoc] = useState(null);
  const { toasts, removeToast, success: toastSuccess, error: toastError } = useToast();

  const fetchRecent = async () => {
    setLoading(true);
    try {
      const res = await documentService.list({ sort: 'created_at_desc', limit: 30 });
      const items = res?.items || res?.data?.items || [];
      setDocuments(items);
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecent();
  }, []);

  const handleCopy = async (id) => {
    try {
      const newDoc = await documentService.copy(id);
      toastSuccess(`Đã nhân bản tài liệu thành công: ${newDoc.code}`);
      fetchRecent();
    } catch {
      toastError('Không thể sao chép tài liệu.');
    }
  };

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Clock size={24} color="var(--color-primary-600)" /> Tài liệu gần đây (Recent Activities)
          </h1>
          <p className="page-desc">Danh sách tài liệu vừa được tạo, cập nhật hoặc thao tác trong hệ thống</p>
        </div>

        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchRecent} loading={loading}>
          Làm mới
        </Button>
      </div>

      <div className="table-container">
        {documents.length === 0 && !loading ? (
          <EmptyState
            icon={Clock}
            title="Chưa có tài liệu nào gần đây"
            description="Hãy tạo hoặc mở tài liệu để ghi nhận lịch sử truy cập."
            action={<Button size="sm" onClick={() => navigate('/tai-lieu')}>Xem tất cả tài liệu</Button>}
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 110 }}>Mã tài liệu</th>
                <th>Tên tài liệu</th>
                <th style={{ width: 120 }}>Loại</th>
                <th style={{ width: 140 }}>Thư mục</th>
                <th style={{ width: 140 }}>Thời gian</th>
                <th style={{ width: 130, textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>{doc.code}</span>
                  </td>
                  <td>
                    <span
                      style={{ fontWeight: 'var(--weight-medium)', cursor: 'pointer', color: 'var(--text-primary)' }}
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
                  <td>
                    <span style={{
                      fontSize: '11px',
                      background: 'var(--bg-muted)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-secondary)'
                    }}>
                      {timeAgo(doc.updated_at || doc.created_at)}
                    </span>
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
