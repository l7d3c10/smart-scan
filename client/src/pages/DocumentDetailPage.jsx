import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Pencil, Trash2, Copy,
  FileText, AlertCircle, Image, ZoomIn, ZoomOut,
  RotateCw, Maximize2, Download,
} from 'lucide-react';
import { useState, useCallback } from 'react';
import { useDocument } from '../hooks/useDocument.js';
import { useToast } from '../hooks/useToast.js';
import { documentService } from '../services/document.service.js';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';
import { ToastContainer } from '../components/ui/ToastContainer.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';

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
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--border-default)' }}>
      <span style={{ width: 110, flexShrink: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 'var(--weight-medium)' }}>
        {label}
      </span>
      <span style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)', flex: 1, wordBreak: 'break-word' }}>
        {value}
      </span>
    </div>
  );
}

export default function DocumentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: doc, loading, error, refetch } = useDocument(id);
  const { toasts, removeToast, success: toastSuccess, error: toastError } = useToast();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [imageTab,   setImageTab]   = useState('original'); // 'original' | 'processed'

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await documentService.delete(id);
      toastSuccess('Đã xóa tài liệu.');
      setTimeout(() => navigate('/tai-lieu'), 1000);
    } catch {
      toastError('Xóa tài liệu thất bại.');
      setDeleting(false);
    }
  }, [id, navigate, toastSuccess, toastError]);

  const handleCopy = () => {
    if (!doc) return;
    const text = `Mã: ${doc.code}\nTên: ${doc.title}\nLoại: ${doc.type_label}\nMô tả: ${doc.description}`;
    navigator.clipboard.writeText(text).then(
      () => toastSuccess('Đã sao chép thông tin tài liệu.'),
      () => toastError('Không thể sao chép.'),
    );
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 'var(--space-6)', alignItems: 'start' }}>
        <div className="table-container" style={{ padding: 'var(--space-6)', minHeight: 400 }}>
          <Skeleton width="100%" height={300} />
        </div>
        <div className="table-container" style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {[80, 200, 100, 120, 160].map((w, i) => <Skeleton key={i} width={w} />)}
          </div>
        </div>
      </div>
    );
  }

  /* ── Error / Not found ── */
  if (error || !doc) {
    return (
      <EmptyState
        icon={AlertCircle}
        title={error?.status === 404 ? 'Không tìm thấy tài liệu' : 'Không thể tải tài liệu'}
        description={error?.status === 404 ? 'Tài liệu không tồn tại hoặc đã bị xóa.' : 'Lỗi kết nối đến máy chủ.'}
        action={
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/tai-lieu')}>
              Quay lại danh sách
            </Button>
            {error?.status !== 404 && <Button size="sm" onClick={refetch}>Thử lại</Button>}
          </div>
        }
      />
    );
  }

  const hasOriginal   = !!doc.original_path;
  const hasProcessed  = !!doc.processed_path;

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 'var(--space-6)', alignItems: 'start' }}>

        {/* ── Image Viewer ── */}
        <div className="table-container">
          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-default)' }}>
            {[
              { key: 'original',  label: 'Ảnh gốc' },
              { key: 'processed', label: 'Ảnh đã xử lý' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setImageTab(key)}
                style={{
                  padding: 'var(--space-3) var(--space-5)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-base)',
                  fontWeight: imageTab === key ? 'var(--weight-semibold)' : 'var(--weight-normal)',
                  color: imageTab === key ? 'var(--color-primary-700)' : 'var(--text-secondary)',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: imageTab === key ? '2px solid var(--color-primary-600)' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  marginBottom: -1,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Image area */}
          <div style={{ minHeight: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)' }}>
            {imageTab === 'original' && !hasOriginal && (
              <EmptyState
                icon={Image}
                title="Chưa có ảnh gốc"
                description="Ảnh tài liệu gốc sẽ hiển thị ở đây sau khi tải lên qua trang Tải lên."
              />
            )}
            {imageTab === 'processed' && !hasProcessed && (
              <EmptyState
                icon={Image}
                title="Chưa có ảnh đã xử lý"
                description="Ảnh sau khi xử lý bằng OpenCV sẽ hiển thị ở đây (Người 2 triển khai)."
              />
            )}
            {imageTab === 'original' && hasOriginal && (
              <img
                src={`/api/uploads/${doc.original_path}`}
                alt="Ảnh gốc tài liệu"
                style={{ maxWidth: '100%', maxHeight: 480, objectFit: 'contain', borderRadius: 'var(--radius-md)' }}
              />
            )}
            {imageTab === 'processed' && hasProcessed && (
              <img
                src={`/api/uploads/${doc.processed_path}`}
                alt="Ảnh đã xử lý"
                style={{ maxWidth: '100%', maxHeight: 480, objectFit: 'contain', borderRadius: 'var(--radius-md)' }}
              />
            )}
          </div>

          {/* Viewer toolbar */}
          <div style={{ display: 'flex', gap: 'var(--space-1)', padding: 'var(--space-3) var(--space-4)', borderTop: '1px solid var(--border-default)', justifyContent: 'center' }}>
            {[
              { icon: ZoomIn,    title: 'Phóng to',      disabled: true },
              { icon: ZoomOut,   title: 'Thu nhỏ',       disabled: true },
              { icon: RotateCw,  title: 'Xoay',          disabled: true },
              { icon: Maximize2, title: 'Toàn màn hình', disabled: true },
              { icon: Download,  title: 'Tải xuống',     disabled: true },
            ].map(({ icon: Icon, title, disabled }) => (
              <button
                key={title}
                className="btn-icon"
                title={`${title}${disabled ? ' (Người 2 triển khai)' : ''}`}
                disabled={disabled}
                style={{ opacity: disabled ? 0.4 : 1 }}
              >
                <Icon size={15} />
              </button>
            ))}
          </div>
        </div>

        {/* ── Info Panel ── */}
        <div className="table-container" style={{ padding: 'var(--space-5)' }}>
          {/* Back + Edit */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
            <button
              className="btn btn-ghost btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={() => navigate('/tai-lieu')}
            >
              <ArrowLeft size={14} /> Quay lại
            </button>
            <Button
              variant="secondary"
              size="sm"
              icon={Pencil}
              onClick={() => navigate(`/tai-lieu/${id}/sua`)}
            >
              Chỉnh sửa
            </Button>
          </div>

          {/* Title section */}
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                {doc.code}
              </span>
              <Badge variant={TYPE_BADGE_VARIANT[doc.type] || 'default'}>{doc.type_label}</Badge>
            </div>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', lineHeight: 'var(--leading-tight)', marginBottom: 'var(--space-1)' }}>
              {doc.title}
            </h2>
          </div>

          {/* Info rows */}
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <InfoRow label="Người tạo" value={`Người dùng #${doc.owner_id}`} />
            <InfoRow label="Ngày tạo"  value={formatDate(doc.created_at)} />
            <InfoRow label="Cập nhật"  value={formatDate(doc.updated_at)} />
          </div>

          {/* Description */}
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
              Mô tả
            </p>
            <p style={{ fontSize: 'var(--text-base)', color: doc.description ? 'var(--text-primary)' : 'var(--text-muted)', lineHeight: 'var(--leading-relaxed)' }}>
              {doc.description || 'Chưa có mô tả.'}
            </p>
          </div>

          {/* Actions */}
          <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="secondary" size="sm" icon={Copy} onClick={handleCopy}>
              Sao chép
            </Button>
            <div style={{ flex: 1 }} />
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={() => setDeleteOpen(true)}
            >
              Xóa
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Xóa tài liệu"
        message={`Bạn có chắc muốn xóa tài liệu "${doc.title}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa tài liệu"
      />

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
