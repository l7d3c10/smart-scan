import { X, ExternalLink, Calendar, User, FileText, Sparkles, Copy, Pencil, Trash2, Download } from 'lucide-react';
import { Badge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';
import { useNavigate } from 'react-router-dom';

const TYPE_BADGE_VARIANT = {
  hoa_don:  'danger',
  hop_dong: 'info',
  giay_to:  'success',
  bien_ban: 'warning',
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

export function DocumentDetailsDrawer({ doc, isOpen, onClose, onCopy, onDelete }) {
  const navigate = useNavigate();
  if (!isOpen || !doc) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(2px)',
          zIndex: 45,
          animation: 'fadeIn 0.15s ease-out',
        }}
      />

      {/* Right Drawer Container */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 440,
          maxWidth: '90vw',
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Drawer Header */}
        <div style={{
          padding: 'var(--space-4) var(--space-5)',
          borderBottom: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <FileText size={18} color="var(--color-primary-600)" />
            <span style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-md)', color: 'var(--text-primary)' }}>
              Thông tin chi tiết tài liệu
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              background: 'var(--color-primary-50)',
              color: 'var(--color-primary-700)',
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 'bold',
            }}>
              {doc.code}
            </span>
          </div>

          <button
            className="btn-icon"
            onClick={onClose}
            title="Đóng (Esc)"
            style={{ width: 32, height: 32 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Content Body */}
        <div style={{
          padding: 'var(--space-5)',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-5)',
        }}>
          {/* Document Preview Canvas */}
          <div style={{
            background: 'var(--bg-muted)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 180,
          }}>
            {doc.processed_path || doc.original_path ? (
              <img
                src={`/api/uploads/${doc.processed_path || doc.original_path}`}
                alt={doc.title}
                style={{
                  maxWidth: '100%',
                  maxHeight: 180,
                  objectFit: 'contain',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
                <FileText size={42} color="var(--text-muted)" />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  Chưa có ảnh đính kèm
                </span>
              </div>
            )}
          </div>

          {/* Title and Badge */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <Badge variant={TYPE_BADGE_VARIANT[doc.type] || 'default'}>
                {doc.type_label}
              </Badge>
              {doc.is_copy && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: 'var(--color-primary-700)',
                  background: 'var(--color-primary-100)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                }}>
                  📋 Đã sao chép
                </span>
              )}
            </div>
            <h3 style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--weight-bold)',
              color: 'var(--text-primary)',
              margin: 0,
              lineHeight: 1.35,
            }}>
              {doc.title}
            </h3>
          </div>

          {/* Metadata Grid */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
            background: 'var(--bg-muted)',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            fontSize: 'var(--text-sm)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Mã tài liệu:</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>{doc.code}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Người sở hữu:</span>
              <span style={{ fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>
                {doc.owner_username || `#${doc.owner_id}`}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Trạng thái xử lý ảnh:</span>
              <span style={{
                fontWeight: 'bold',
                color: doc.processed_path ? 'var(--color-success)' : 'var(--color-warning)'
              }}>
                {doc.processed_path ? '✓ Đã xử lý OpenCV' : 'Chưa xử lý'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Ngày tạo:</span>
              <span>{formatDate(doc.created_at)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Ngày cập nhật:</span>
              <span>{formatDate(doc.updated_at)}</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <span style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--weight-bold)',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Mô tả chi tiết:
            </span>
            <p style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-primary)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              marginTop: 'var(--space-2)',
              minHeight: 60,
              lineHeight: 1.5,
            }}>
              {doc.description || 'Chưa có mô tả nội dung.'}
            </p>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div style={{
          padding: 'var(--space-4) var(--space-5)',
          borderTop: '1px solid var(--border-default)',
          background: 'var(--bg-surface)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'var(--space-2)',
        }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button
              variant="secondary"
              size="sm"
              icon={Copy}
              onClick={() => {
                onCopy(doc.id);
                onClose();
              }}
            >
              Sao chép
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={Pencil}
              onClick={() => navigate(`/tai-lieu/${doc.id}/sua`)}
            >
              Chỉnh sửa
            </Button>
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={ExternalLink}
            onClick={() => navigate(`/tai-lieu/${doc.id}`)}
          >
            Trang chi tiết
          </Button>
        </div>
      </aside>
    </>
  );
}
