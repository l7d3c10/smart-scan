import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

const ICONS = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  danger: AlertCircle,
};

export function Alert({ variant = 'info', title, children, onClose, style = {} }) {
  const Icon = ICONS[variant] || Info;

  const bgColors = {
    info: 'var(--color-info-bg)',
    success: 'var(--color-success-bg)',
    warning: 'var(--color-warning-bg)',
    danger: 'var(--color-danger-bg)',
  };

  const borderColors = {
    info: 'var(--color-info-border)',
    success: 'var(--color-success-border)',
    warning: 'var(--color-warning-border)',
    danger: 'var(--color-danger-border)',
  };

  const textColors = {
    info: 'var(--color-info-text)',
    success: 'var(--color-success-text)',
    warning: 'var(--color-warning-text)',
    danger: 'var(--color-danger-text)',
  };

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--space-3)',
        padding: 'var(--space-3) var(--space-4)',
        borderRadius: 'var(--radius-md)',
        backgroundColor: bgColors[variant],
        border: `1px solid ${borderColors[variant]}`,
        color: textColors[variant],
        fontSize: 'var(--text-base)',
        lineHeight: 'var(--leading-normal)',
        ...style,
      }}
    >
      <Icon size={18} style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        {title && <div style={{ fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-1)' }}>{title}</div>}
        <div>{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: 0,
            opacity: 0.7,
          }}
          aria-label="Đóng cảnh báo"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
