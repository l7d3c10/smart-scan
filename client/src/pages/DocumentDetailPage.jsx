import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Pencil, Trash2, Copy,
  FileText, AlertCircle, Image as ImageIcon, ZoomIn, ZoomOut,
  RotateCw, RefreshCw, Maximize2, Download, Clock, User, CheckCircle2,
  Calendar, Upload
} from 'lucide-react';
import { useState, useCallback, useEffect, useRef } from 'react';
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
      <span style={{ width: 120, flexShrink: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 'var(--weight-medium)' }}>
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
  const [deleting, setDeleting] = useState(false);
  const [imageTab, setImageTab] = useState('processed'); // 'processed' | 'original'

  // Image controls state
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const viewerRef = useRef(null);

  // History state
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (doc?.id) {
      setLoadingHistory(true);
      documentService.history(doc.id)
        .then((res) => {
          setHistory(res?.data || []);
        })
        .catch(() => {
          setHistory([]);
        })
        .finally(() => setLoadingHistory(false));
    }
  }, [doc?.id]);

  // Adjust default tab if no processed image
  useEffect(() => {
    if (doc && !doc.processed_path && doc.original_path) {
      setImageTab('original');
    }
  }, [doc]);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await documentService.moveToTrash(id);
      toastSuccess('Đã chuyển tài liệu vào Thùng rác.');
      setTimeout(() => navigate('/tai-lieu'), 1000);
    } catch {
      toastError('Chuyển tài liệu vào Thùng rác thất bại.');
      setDeleting(false);
    }
  }, [id, navigate, toastSuccess, toastError]);

  const handleCopy = async () => {
    if (!doc) return;
    try {
      const copied = await documentService.copy(doc.id);
      toastSuccess(`Đã nhân bản tài liệu thành công: ${copied.code}`);
      setTimeout(() => navigate(`/tai-lieu/${copied.id}`), 1000);
    } catch {
      toastError('Không thể sao chép tài liệu.');
    }
  };

  // Image zoom/rotate handlers
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const handleResetView = () => {
    setZoom(1);
    setRotation(0);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      viewerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const currentImagePath = imageTab === 'processed' ? doc?.processed_path : doc?.original_path;
  const currentImageUrl = currentImagePath && doc?.id ? `/api/documents/${doc.id}/image/${imageTab}` : null;

  const handleDownload = () => {
    if (!currentImageUrl) return;
    const a = document.createElement('a');
    a.href = currentImageUrl;
    a.download = `${doc.code}_${imageTab}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 'var(--space-6)', alignItems: 'start' }}>
        <div className="table-container" style={{ padding: 'var(--space-6)', minHeight: 450 }}>
          <Skeleton width="100%" height={380} />
        </div>
        <div className="table-container" style={{ padding: 'var(--space-6)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {[80, 200, 100, 120, 160].map((w, i) => <Skeleton key={i} width={w} />)}
          </div>
        </div>
      </div>
    );
  }

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

  return (
    <>
      {/* Header breadcrumb & actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/tai-lieu')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <ArrowLeft size={15} /> Danh sách
          </button>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-primary-700)' }}>
            {doc.code}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="secondary" size="sm" icon={Copy} onClick={handleCopy}>
            Nhân bản tài liệu
          </Button>
          <Button variant="secondary" size="sm" icon={Pencil} onClick={() => navigate(`/tai-lieu/${id}/sua`)}>
            Chỉnh sửa
          </Button>
          <Button variant="danger" size="sm" icon={Trash2} onClick={() => setDeleteOpen(true)}>
            Xóa
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 'var(--space-6)', alignItems: 'start' }}>

        {/* ── Image Viewer (Left 2/3) ── */}
        <div className="table-container" ref={viewerRef} style={{ background: 'var(--bg-surface)' }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-default)', padding: '0 var(--space-4)' }}>
            <div style={{ display: 'flex' }}>
              {[
                { key: 'processed', label: 'Ảnh đã xử lý (OpenCV)' },
                { key: 'original',  label: 'Ảnh gốc chụp' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => {
                    setImageTab(key);
                    handleResetView();
                  }}
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: imageTab === key ? 'var(--weight-semibold)' : 'var(--weight-normal)',
                    color: imageTab === key ? 'var(--color-primary-600)' : 'var(--text-secondary)',
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

            {currentImagePath && (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                Thu phóng: {Math.round(zoom * 100)}% | Xoay: {rotation}°
              </span>
            )}
          </div>

          {/* Image Display Canvas */}
          <div style={{
            minHeight: 420,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-4)',
            overflow: 'hidden',
            backgroundColor: 'var(--bg-muted)',
            position: 'relative'
          }}>
            {imageTab === 'processed' && !doc.processed_path && (
              <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                <ImageIcon size={48} color="var(--text-muted)" style={{ margin: '0 auto var(--space-3)' }} />
                <h4 style={{ margin: '0 0 var(--space-2)' }}>Chưa có ảnh đã xử lý</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', maxWidth: 320, margin: '0 auto var(--space-4)' }}>
                  Tài liệu này chưa trải qua các bước nắn góc phối cảnh và làm rõ chữ của OpenCV.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Upload}
                  onClick={() => navigate(`/tai-len?documentId=${doc.id}`)}
                >
                  Xử lý ảnh ngay
                </Button>
              </div>
            )}

            {imageTab === 'original' && !doc.original_path && (
              <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                <ImageIcon size={48} color="var(--text-muted)" style={{ margin: '0 auto var(--space-3)' }} />
                <h4 style={{ margin: '0 0 var(--space-2)' }}>Chưa có ảnh gốc</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', maxWidth: 320, margin: '0 auto var(--space-4)' }}>
                  Hãy tải ảnh lên để bắt đầu lưu trữ và xử lý.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Upload}
                  onClick={() => navigate(`/tai-len?documentId=${doc.id}`)}
                >
                  Tải ảnh lên
                </Button>
              </div>
            )}

            {currentImagePath && (
              <div style={{
                transition: 'transform 0.15s ease-out',
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                maxWidth: '100%',
                maxHeight: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img
                  src={currentImageUrl}
                  alt={doc.title}
                  style={{
                    maxWidth: '100%',
                    maxHeight: 460,
                    objectFit: 'contain',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-md)',
                  }}
                />
              </div>
            )}
          </div>

          {/* Interactive Viewer Toolbar */}
          <div style={{
            display: 'flex',
            gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-4)',
            borderTop: '1px solid var(--border-default)',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'var(--bg-surface)',
            flexWrap: 'wrap'
          }}>
            <button
              className="btn btn-secondary btn-sm"
              title="Phóng to ảnh"
              onClick={handleZoomIn}
              disabled={!currentImagePath}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <ZoomIn size={15} />
              <span>Phóng to</span>
            </button>

            <button
              className="btn btn-secondary btn-sm"
              title="Thu nhỏ ảnh"
              onClick={handleZoomOut}
              disabled={!currentImagePath}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <ZoomOut size={15} />
              <span>Thu nhỏ</span>
            </button>

            <button
              className="btn btn-primary btn-sm"
              title="Xoay ảnh 90 độ"
              onClick={handleRotate}
              disabled={!currentImagePath}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <RotateCw size={15} />
              <span>Xoay 90° ({rotation}°)</span>
            </button>

            <button
              className="btn btn-secondary btn-sm"
              title="Toàn màn hình"
              onClick={handleToggleFullscreen}
              disabled={!currentImagePath}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <Maximize2 size={15} />
              <span>Toàn màn hình</span>
            </button>

            <button
              className="btn btn-secondary btn-sm"
              title="Tải ảnh về máy"
              onClick={handleDownload}
              disabled={!currentImagePath}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <Download size={15} />
              <span>Tải về</span>
            </button>

            {currentImagePath && (zoom !== 1 || rotation !== 0) && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleResetView}
                title="Khôi phục góc xoay và độ thu phóng ban đầu"
                style={{ fontSize: 'var(--text-xs)', marginLeft: 'var(--space-2)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <RefreshCw size={14} />
                <span>Đặt lại vị trí</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Metadata & History Panel (Right 1/3) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Main Info */}
          <div className="table-container" style={{ padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--color-primary-700)', fontWeight: 'var(--weight-bold)' }}>
                {doc.code}
              </span>
              <Badge variant={TYPE_BADGE_VARIANT[doc.type] || 'default'}>{doc.type_label}</Badge>
              {doc.is_copy && (
                <span style={{ fontSize: '10px', color: 'var(--color-primary-700)', background: 'var(--color-primary-100)', padding: '1px 6px', borderRadius: 'var(--radius-sm)' }}>
                  📋 Đã sao chép
                </span>
              )}
            </div>

            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>
              {doc.title}
            </h2>

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <InfoRow label="Người tạo" value={doc.owner_username || `#${doc.owner_id}`} />
              <InfoRow label="Ngày tạo"  value={formatDate(doc.created_at)} />
              <InfoRow label="Ngày sửa"  value={formatDate(doc.updated_at)} />
              <InfoRow label="Chế độ xử lý" value={doc.process_mode ? `OpenCV (${doc.process_mode})` : 'Chưa có'} />
            </div>

            <div>
              <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)', textTransform: 'uppercase' }}>
                Mô tả
              </p>
              <p style={{
                fontSize: 'var(--text-sm)',
                color: doc.description ? 'var(--text-primary)' : 'var(--text-muted)',
                lineHeight: 'var(--leading-relaxed)',
                background: 'var(--bg-muted)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                margin: 0
              }}>
                {doc.description || 'Chưa có mô tả chi tiết.'}
              </p>
            </div>
          </div>

          {/* History Section (5 recent audit operations) */}
          <div className="table-container" style={{ padding: 'var(--space-5)' }}>
            <h4 style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-semibold)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              marginBottom: 'var(--space-3)'
            }}>
              <Clock size={16} color="var(--color-primary-600)" />
              Lịch sử thao tác (5 dòng gần nhất)
            </h4>

            {loadingHistory && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Đang tải lịch sử...</p>}

            {!loadingHistory && history.length === 0 && (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: 0 }}>
                Chưa có nhật ký hoạt động nào cho tài liệu này.
              </p>
            )}

            {!loadingHistory && history.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {history.map((item) => (
                  <div key={item.id} style={{
                    fontSize: 'var(--text-xs)',
                    padding: 'var(--space-2)',
                    background: 'var(--bg-muted)',
                    borderRadius: 'var(--radius-sm)',
                    borderLeft: '3px solid var(--color-primary-500)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
                        {item.action}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      Thực hiện bởi: {item.actor_username}
                    </div>
                    {item.detail && (
                      <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>
                        {item.detail}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Chuyển vào Thùng rác"
        message={`Bạn có chắc muốn chuyển tài liệu "${doc.title}" vào Thùng rác? Bạn có thể khôi phục lại từ mục Thùng rác.`}
        confirmLabel="Chuyển vào Thùng rác"
      />

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
