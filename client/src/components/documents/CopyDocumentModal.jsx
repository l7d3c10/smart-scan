import { useState, useEffect } from 'react';
import { Copy, Folder } from 'lucide-react';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';
import { documentService } from '../../services/document.service.js';

const DEFAULT_FOLDERS = [
  'Tài liệu nội bộ',
  'Dự án Marketing',
  'Dự án IT & Công nghệ',
  'Hợp đồng đối tác 2026',
  'Chứng từ tài chính quý 4',
];

function suggestCopyTitle(originalTitle = '') {
  const match = originalTitle.match(/^(.*?)\s*\(Bản sao(?:\s+(\d+))?\)$/);
  if (!match) {
    return `${originalTitle} (Bản sao)`.slice(0, 150);
  }
  const base = match[1].trim();
  const nextNum = match[2] ? Number(match[2]) + 1 : 2;
  const suffix = ` (Bản sao ${nextNum})`;
  return `${base.slice(0, Math.max(1, 150 - suffix.length))}${suffix}`;
}

export function CopyDocumentModal({ doc, isOpen, onClose, onConfirm, copying = false }) {
  const [title, setTitle] = useState('');
  const [folderName, setFolderName] = useState('Tài liệu nội bộ');
  const [openEditAfter, setOpenEditAfter] = useState(false);
  const [folders, setFolders] = useState(DEFAULT_FOLDERS);

  useEffect(() => {
    if (isOpen && doc) {
      setTitle(suggestCopyTitle(doc.title || ''));
      setFolderName(doc.folder_name || 'Tài liệu nội bộ');
      setOpenEditAfter(false);
      documentService.folders().then((res) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        if (list.length > 0) {
          setFolders(list.map((f) => f.name));
        }
      }).catch(() => {});
    }
  }, [isOpen, doc]);

  if (!isOpen || !doc) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onConfirm(doc.id, {
      title: title.trim(),
      folderName,
      openEditAfter,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Copy size={18} color="var(--color-primary-600)" />
          <span>Sao chép tài liệu ({doc.code})</span>
        </div>
      }
      size="sm"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="copy-doc-title">
            Tên tài liệu bản sao <span style={{ color: 'var(--color-danger-600)' }}>*</span>
          </label>
          <input
            id="copy-doc-title"
            type="text"
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={150}
            required
            autoFocus
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="copy-doc-folder" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Folder size={14} color="var(--color-primary-600)" /> Lưu vào thư mục
          </label>
          <select
            id="copy-doc-folder"
            className="form-control"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
          >
            {folders.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
        }}>
          <input
            type="checkbox"
            checked={openEditAfter}
            onChange={(e) => setOpenEditAfter(e.target.checked)}
          />
          Mở trang chỉnh sửa ngay sau khi sao chép
        </label>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', paddingTop: 'var(--space-2)' }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={copying}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" icon={Copy} loading={copying} disabled={!title.trim()}>
            Tạo bản sao
          </Button>
        </div>
      </form>
    </Modal>
  );
}
