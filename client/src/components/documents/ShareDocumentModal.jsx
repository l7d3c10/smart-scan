import { useState } from 'react';
import { Share2, Link2, Copy, Check, UserPlus, Shield, X, Clock } from 'lucide-react';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';
import { useToast } from '../../hooks/useToast.js';

export function ShareDocumentModal({ doc, isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer'); // 'viewer' | 'editor' | 'downloader'
  const [copiedLink, setCopiedLink] = useState(false);
  const [sharedUsers, setSharedUsers] = useState([
    { email: 'hoang.lead@enterprise.vn', role: 'editor', name: 'Hoàng Lead' },
    { email: 'audit.internal@enterprise.vn', role: 'viewer', name: 'Audit Team' },
  ]);

  if (!isOpen || !doc) return null;

  const shareUrl = `${window.location.origin}/tai-lieu/${doc.id}?shared=true`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSharedUsers([...sharedUsers, { email: email.trim(), role, name: email.split('@')[0] }]);
    setEmail('');
  };

  const handleRemoveUser = (targetEmail) => {
    setSharedUsers(sharedUsers.filter((u) => u.email !== targetEmail));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Share2 size={18} color="var(--color-primary-600)" />
          <span>Chia sẻ tài liệu: {doc.title}</span>
        </div>
      }
      size="md"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

        {/* Share with email form */}
        <form onSubmit={handleAddUser}>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <input
              type="email"
              className="form-control"
              placeholder="Nhập email người nhận (ví dụ: colleague@company.com)..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ flex: 1 }}
            />
            <select
              className="form-control form-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{ width: 140 }}
            >
              <option value="viewer">Quyền: Xem</option>
              <option value="editor">Quyền: Chỉnh sửa</option>
              <option value="downloader">Xem & Tải về</option>
            </select>
            <Button variant="primary" type="submit" icon={UserPlus}>
              Gửi
            </Button>
          </div>
        </form>

        {/* Shareable Link Box */}
        <div style={{
          background: 'var(--bg-muted)',
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', overflow: 'hidden' }}>
            <Link2 size={16} color="var(--color-primary-600)" />
            <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {shareUrl}
            </span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={copiedLink ? Check : Copy}
            onClick={handleCopyLink}
          >
            {copiedLink ? 'Đã chép link' : 'Sao chép link'}
          </Button>
        </div>

        {/* List of people with access */}
        <div>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Người có quyền truy cập ({sharedUsers.length + 1}):
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            {/* Owner row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-default)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-primary-100)', color: 'var(--color-primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '11px' }}>
                  {doc.owner_username?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold' }}>{doc.owner_username}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Chủ sở hữu tài liệu</div>
                </div>
              </div>
              <span className="badge badge-primary">Chủ sở hữu</span>
            </div>

            {/* Shared users rows */}
            {sharedUsers.map((u) => (
              <div key={u.email} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-default)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--text-sm)' }}>{u.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.email}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                    {u.role === 'editor' ? 'Chỉnh sửa' : 'Chỉ xem'}
                  </span>
                  <button
                    className="btn-icon btn-icon-danger"
                    title="Thu hồi quyền"
                    onClick={() => handleRemoveUser(u.email)}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
          <Button variant="secondary" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
}
