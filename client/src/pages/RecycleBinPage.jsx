import { useState, useEffect } from 'react';
import { Trash2, RotateCcw, AlertTriangle, RefreshCw, FileText, CheckSquare, Square } from 'lucide-react';
import { documentService } from '../services/document.service.js';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';
import { useToast } from '../hooks/useToast.js';
import { ToastContainer } from '../components/ui/ToastContainer.jsx';

export default function RecycleBinPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null); // 'all' or id
  const [deleting, setDeleting] = useState(false);
  const { toasts, removeToast, success: toastSuccess, error: toastError } = useToast();

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const res = await documentService.list({ isDeleted: true, limit: 50 });
      const items = res?.items || res?.data?.items || [];
      setDocuments(items);
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const handleRestore = async (id) => {
    try {
      await documentService.restoreFromTrash(id);
      toastSuccess('Đã khôi phục tài liệu thành công!');
      fetchTrash();
    } catch {
      toastError('Khôi phục thất bại.');
    }
  };

  const handleEmptyTrash = async () => {
    setDeleting(true);
    try {
      await documentService.emptyTrash();
      toastSuccess('Đã dọn sạch toàn bộ thùng rác.');
      setDeleteTarget(null);
      fetchTrash();
    } catch {
      toastError('Thao tác thất bại.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Trash2 size={24} color="var(--color-danger)" /> Thùng rác tài liệu (Recycle Bin)
          </h1>
          <p className="page-desc">Các tài liệu bị xóa sẽ được lưu trữ tại đây và có thể khôi phục lại khi cần</p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button
            variant="danger"
            size="sm"
            icon={Trash2}
            disabled={documents.length === 0}
            onClick={() => setDeleteTarget('all')}
          >
            Dọn sạch thùng rác
          </Button>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchTrash} loading={loading}>
            Làm mới
          </Button>
        </div>
      </div>

      <div className="table-container">
        {documents.length === 0 && !loading ? (
          <EmptyState
            icon={Trash2}
            title="Thùng rác trống"
            description="Hiện không có tài liệu nào trong thùng rác."
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 110 }}>Mã tài liệu</th>
                <th>Tên tài liệu</th>
                <th style={{ width: 130 }}>Loại</th>
                <th style={{ width: 150 }}>Thời gian xóa</th>
                <th style={{ width: 160, textAlign: 'center' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>{doc.code}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 'var(--weight-medium)' }}>{doc.title}</span>
                  </td>
                  <td>
                    <Badge variant="default">{doc.type_label}</Badge>
                  </td>
                  <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    {doc.deleted_at ? new Date(doc.deleted_at).toLocaleString('vi-VN') : 'Gần đây'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'center' }}>
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={RotateCcw}
                        onClick={() => handleRestore(doc.id)}
                      >
                        Khôi phục
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleEmptyTrash}
        loading={deleting}
        title="Dọn sạch thùng rác vĩnh viễn"
        message="Hành động này sẽ xóa vĩnh viễn toàn bộ tài liệu trong thùng rác và KHÔNG THỂ khôi phục. Bạn có chắc chắn muốn tiếp tục?"
        confirmLabel="Xóa vĩnh viễn tất cả"
      />

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
