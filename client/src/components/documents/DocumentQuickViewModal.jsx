import { Eye, ExternalLink, Calendar, User, FileText, Sparkles, X, Copy, Pencil } from 'lucide-react';
import { Badge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';
import { Modal } from '../ui/Modal.jsx';
import { useNavigate } from 'react-router-dom';

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

export function DocumentQuickViewModal({ doc, isOpen, onClose, onCopy }) {
  const navigate = useNavigate();
  if (!doc) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Sparkles size={18} color="var(--color-primary-600)" />
          <span>Tổng quan nhanh tài liệu</span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            background: 'var(--color-primary-50)',
            color: 'var(--color-primary-700)',
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)'
          }}>
            {doc.code}
          </span>
        </div>
      }
      size="md"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Title and Badge */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <Badge variant={TYPE_BADGE_VARIANT[doc.type] || 'default'}>
              {doc.type_label}
            </Badge>
            {doc.is_copy && (
              <span style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--weight-semibold)',
                color: 'var(--color-primary-700)',
                background: 'var(--color-primary-100)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}>
                📋 Đã sao chép
              </span>
            )}
          </div>
          <h3 style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--weight-bold)',
            color: 'var(--text-primary)',
            margin: 0
          }}>
            {doc.title}
          </h3>
        </div>

        {/* Metadata grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 'var(--space-3)',
          background: 'var(--bg-muted)',
          padding: 'var(--space-3)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--text-sm)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <User size={15} color="var(--text-muted)" />
            <span style={{ color: 'var(--text-secondary)' }}>Người sở hữu:</span>
            <span style={{ fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>
              {doc.owner_username || `#${doc.owner_id}`}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Calendar size={15} color="var(--text-muted)" />
            <span style={{ color: 'var(--text-secondary)' }}>Ngày tạo:</span>
            <span style={{ color: 'var(--text-primary)' }}>{formatDate(doc.created_at)}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <FileText size={15} color="var(--text-muted)" />
            <span style={{ color: 'var(--text-secondary)' }}>Trạng thái ảnh:</span>
            <span style={{
              fontWeight: 'var(--weight-medium)',
              color: doc.processed_path ? 'var(--color-success)' : 'var(--color-warning)'
            }}>
              {doc.processed_path ? '✓ Đã xử lý OpenCV' : 'Chưa có ảnh xử lý'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Calendar size={15} color="var(--text-muted)" />
            <span style={{ color: 'var(--text-secondary)' }}>Cập nhật:</span>
            <span style={{ color: 'var(--text-primary)' }}>{formatDate(doc.updated_at)}</span>
          </div>
        </div>

        {/* Description */}
        <div>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Mô tả nội dung:
          </span>
          <p style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-primary)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-md)',
            marginTop: 'var(--space-1)',
            minHeight: 48,
            lineHeight: 'var(--leading-relaxed)'
          }}>
            {doc.description || 'Không có mô tả chi tiết.'}
          </p>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-2)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-default)' }}>
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
              Nhân bản
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={Pencil}
              onClick={() => {
                navigate(`/tai-lieu/${doc.id}/sua`);
              }}
            >
              Chỉnh sửa
            </Button>
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={ExternalLink}
            onClick={() => {
              navigate(`/tai-lieu/${doc.id}`);
            }}
          >
            Mở chi tiết đầy đủ
          </Button>
        </div>
      </div>
    </Modal>
  );
}
