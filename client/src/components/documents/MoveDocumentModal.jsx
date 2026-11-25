import { useState, useEffect } from 'react';
import { Folder, FolderPlus, Check, ArrowRight } from 'lucide-react';
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

export function MoveDocumentModal({ doc, isOpen, onClose, onMove }) {
  const [selectedFolder, setSelectedFolder] = useState(doc?.folder_name || 'Tài liệu nội bộ');
  const [newFolderName, setNewFolderName] = useState('');
  const [folders, setFolders] = useState(DEFAULT_FOLDERS);
  const [showNewFolder, setShowNewFolder] = useState(false);

  useEffect(() => {
    if (isOpen) {
      documentService.folders().then((res) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        if (list.length > 0) {
          setFolders(list.map((f) => f.name));
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen || !doc) return null;

  const handleAddFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    try {
      await documentService.createFolder({ name });
      setFolders((prev) => prev.includes(name) ? prev : [...prev, name]);
      setSelectedFolder(name);
      setNewFolderName('');
      setShowNewFolder(false);
    } catch {
      setFolders((prev) => prev.includes(name) ? prev : [...prev, name]);
      setSelectedFolder(name);
      setNewFolderName('');
      setShowNewFolder(false);
    }
  };

  const handleConfirm = () => {
    onMove(doc.id, selectedFolder);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Folder size={18} color="var(--color-primary-600)" />
          <span>Di chuyển tài liệu: {doc.title}</span>
        </div>
      }
      size="sm"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
          Chọn thư mục đích để lưu trữ và quản lý tài liệu này:
        </p>

        {/* Folder list */}
        <div style={{
          maxHeight: 220,
          overflowY: 'auto',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-2)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}>
          {folders.map((f) => {
            const isSelected = selectedFolder === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setSelectedFolder(f)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: isSelected ? 'var(--color-primary-50)' : 'transparent',
                  color: isSelected ? 'var(--color-primary-700)' : 'var(--text-primary)',
                  fontWeight: isSelected ? 'bold' : 'normal',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: 'var(--text-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Folder size={16} color={isSelected ? 'var(--color-primary-600)' : 'var(--text-muted)'} />
                  <span>{f}</span>
                </div>
                {isSelected && <Check size={16} color="var(--color-primary-600)" />}
              </button>
            );
          })}
        </div>

        {/* Add new folder form */}
        {!showNewFolder ? (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setShowNewFolder(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}
          >
            <FolderPlus size={15} /> Tạo thư mục mới
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Tên thư mục mới..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              autoFocus
            />
            <Button size="sm" variant="primary" onClick={handleAddFolder}>
              Tạo
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowNewFolder(false)}>
              Hủy
            </Button>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--border-default)' }}>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button variant="primary" icon={ArrowRight} onClick={handleConfirm}>
            Xác nhận di chuyển
          </Button>
        </div>
      </div>
    </Modal>
  );
}
