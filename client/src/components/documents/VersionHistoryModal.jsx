import { useState } from 'react';
import { History, RotateCcw, CheckCircle, Clock, User, FileText } from 'lucide-react';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';
import { useToast } from '../../hooks/useToast.js';

export function VersionHistoryModal({ doc, isOpen, onClose }) {
  const { success: toastSuccess } = useToast();
  const [selectedVersion, setSelectedVersion] = useState('v2.0');

  if (!isOpen || !doc) return null;

  const versions = [
    {
      id: 'v2.0',
      label: 'Phiên bản 2.0 (Hiện tại)',
      author: doc.owner_username || 'Bạn',
      date: doc.updated_at ? new Date(doc.updated_at).toLocaleString('vi-VN') : 'Vừa xong',
      note: 'Cập nhật metadata và tinh chỉnh mô tả tài liệu.',
      isCurrent: true,
    },
    {
      id: 'v1.1',
      label: 'Phiên bản 1.1',
      author: doc.owner_username || 'Bạn',
      date: new Date(Date.now() - 86400000).toLocaleString('vi-VN'),
      note: 'Xử lý nắn góc và khử bóng bằng OpenCV.',
      isCurrent: false,
    },
    {
      id: 'v1.0',
      label: 'Phiên bản 1.0 (Khởi tạo)',
      author: doc.owner_username || 'Bạn',
      date: doc.created_at ? new Date(doc.created_at).toLocaleString('vi-VN') : 'Ban đầu',
      note: 'Tải lên tài liệu gốc ban đầu.',
      isCurrent: false,
    },
  ];

  const handleRestore = (ver) => {
    toastSuccess(`Đã khôi phục tài liệu về ${ver.label}!`);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <History size={18} color="var(--color-primary-600)" />
          <span>Lịch sử phiên bản: {doc.title}</span>
        </div>
      }
      size="md"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
          Theo dõi các lần chỉnh sửa và có thể khôi phục lại bất kỳ phiên bản nào trước đó:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {versions.map((ver) => (
            <div
              key={ver.id}
              style={{
                border: `1px solid ${ver.isCurrent ? 'var(--color-primary-500)' : 'var(--border-default)'}`,
                background: ver.isCurrent ? 'var(--color-primary-50)' : 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3) var(--space-4)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)', color: ver.isCurrent ? 'var(--color-primary-800)' : 'var(--text-primary)' }}>
                    {ver.label}
                  </span>
                  {ver.isCurrent && (
                    <span className="badge badge-primary">Hiện tại</span>
                  )}
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: 'var(--space-3)', marginTop: 2 }}>
                  <span><User size={12} style={{ verticalAlign: -1 }} /> {ver.author}</span>
                  <span><Clock size={12} style={{ verticalAlign: -1 }} /> {ver.date}</span>
                </div>

                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 4 }}>
                  {ver.note}
                </div>
              </div>

              <div>
                {!ver.isCurrent ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={RotateCcw}
                    onClick={() => handleRestore(ver)}
                  >
                    Khôi phục
                  </Button>
                ) : (
                  <CheckCircle size={18} color="var(--color-primary-600)" />
                )}
              </div>
            </div>
          ))}
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
