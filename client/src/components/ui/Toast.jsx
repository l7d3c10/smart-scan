import { X, CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

const ICONS = {
  success: <CheckCircle2 size={16} color="var(--color-success)" />,
  error: <XCircle size={16} color="var(--color-danger)" />,
  warning: <AlertTriangle size={16} color="var(--color-warning)" />,
  info: <Info size={16} color="var(--color-info)" />,
};

export function Toast({ id, type, message, onClose }) {
  return (
    <div className={`toast toast-${type}`} role="alert">
      <span className="toast-icon">{ICONS[type]}</span>
      <div className="toast-content">
        <p className="toast-message">{message}</p>
      </div>
      <button className="toast-close" onClick={() => onClose(id)} aria-label="Đóng">
        <X size={14} />
      </button>
    </div>
  );
}
