import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { documentService } from '../services/document.service.js';
import { useDocument } from '../hooks/useDocument.js';
import { useToast } from '../hooks/useToast.js';
import { Button } from '../components/ui/Button.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ToastContainer } from '../components/ui/ToastContainer.jsx';
import { DocumentForm } from '../components/documents/DocumentForm.jsx';
import { imageService } from '../services/image.service.js';

export default function DocumentEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: doc, loading, error, refetch } = useDocument(id);
  const { toasts, removeToast, success: toastSuccess, error: toastError } = useToast();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (form) => {
    setSaving(true);
    try {
      const data = {
        title: form.title.trim(),
        type: form.type,
        description: form.description.trim(),
      };
      const updated = form.imageDraftId
        ? (await imageService.save(form.imageDraftId, { ...data, documentId: id })).document
        : await documentService.update(id, {
          ...data,
          ...(form.imageSourceId ? { imageSourceId: form.imageSourceId } : {}),
        });
      toastSuccess(`Đã cập nhật tài liệu "${updated.title}".`);
      sessionStorage.removeItem(`smartscan_document_form_edit_${id}`);
      sessionStorage.removeItem('smartscan_active_upload');
      setTimeout(() => navigate('/tai-lieu'), 1000);
    } catch (err) {
      toastError(err.message || 'Cập nhật tài liệu thất bại.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-6)' }}>
        <div className="table-container" style={{ padding: 'var(--space-6)', minHeight: 350 }}>
          <Skeleton width="100%" height={280} />
        </div>
        <div className="table-container" style={{ padding: 'var(--space-6)' }}>
          <Skeleton width="100%" height={150} />
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Không thể tải tài liệu"
        description={error?.message || 'Tài liệu không tồn tại hoặc bạn không có quyền chỉnh sửa.'}
        action={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="secondary" onClick={() => navigate('/tai-lieu')}>Quay lại danh sách</Button>
            <Button onClick={refetch}>Thử lại</Button>
          </div>
        }
      />
    );
  }

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Chỉnh sửa tài liệu: {doc.code}</h1>
          <p className="page-desc">Cập nhật thông tin chi tiết tài liệu trong hệ thống</p>
        </div>
        <Button
          variant="ghost"
          icon={ArrowLeft}
          onClick={() => navigate('/tai-lieu')}
        >
          Quay lại danh sách
        </Button>
      </div>

      <DocumentForm
        mode="edit"
        initialData={doc}
        onSubmit={handleSubmit}
        saving={saving}
      />

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
