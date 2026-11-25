import { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Upload, ArrowRight, ArrowLeft, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { useToast } from '../hooks/useToast.js';
import { ToastContainer } from '../components/ui/ToastContainer.jsx';
import { api } from '../services/api.js';

export default function UploadPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const documentId = searchParams.get('documentId'); // If updating photo for existing document

  const { toasts, removeToast, success: toastSuccess, error: toastError } = useToast();
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleSelectFile = (selected) => {
    if (!selected) return;
    const ext = selected.name.toLowerCase().split('.').pop();
    if (!['jpg', 'jpeg', 'png'].includes(ext)) {
      toastError('Chỉ chấp nhận file định dạng JPG hoặc PNG.');
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      toastError('Dung lượng ảnh tối đa là 5MB.');
      return;
    }

    setFile(selected);
    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleContinue = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.upload('/uploads', file);
      const uploadId = res?.data?.id || res?.id || 'demo-upload-id';
      toastSuccess('Tải ảnh lên thành công!');
      setTimeout(() => {
        navigate(`/tai-len/${uploadId}/xu-ly${documentId ? `?documentId=${documentId}` : ''}`);
      }, 800);
    } catch (err) {
      toastError(err.message || 'Tải ảnh lên máy chủ thất bại.');
      setUploading(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Quy trình số hóa tài liệu</h1>
        <p className="page-desc">Chụp hoặc tải ảnh tài liệu để hệ thống nắn góc và tối ưu độ nét văn bản</p>
      </div>

      {/* 3 Steps Progress Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4) var(--space-6)',
        marginBottom: 'var(--space-6)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-primary-600)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>1</div>
          <div>
            <div style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--color-primary-700)' }}>Bước 1: Tải ảnh gốc</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Chụp ảnh hoặc chọn file JPG/PNG</div>
          </div>
        </div>

        <ArrowRight size={20} color="var(--text-muted)" />

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', opacity: 0.5 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-muted)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>2</div>
          <div>
            <div style={{ fontWeight: 'var(--weight-semibold)' }}>Bước 2: Xử lý ảnh OpenCV</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Nắn thẳng & làm rõ nét chữ</div>
          </div>
        </div>

        <ArrowRight size={20} color="var(--text-muted)" />

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', opacity: 0.5 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-muted)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>3</div>
          <div>
            <div style={{ fontWeight: 'var(--weight-semibold)' }}>Bước 3: Lưu trữ tài liệu</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Đặt tên & phân loại hồ sơ</div>
          </div>
        </div>
      </div>

      {/* Main Upload Box */}
      <div style={{ display: 'grid', gridTemplateColumns: previewUrl ? '1fr 340px' : '1fr', gap: 'var(--space-6)' }}>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragActive ? 'var(--color-primary-500)' : 'var(--border-strong)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-10) var(--space-6)',
            textAlign: 'center',
            backgroundColor: dragActive ? 'var(--color-primary-50)' : 'var(--bg-surface)',
            cursor: 'pointer',
            minHeight: 360,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            transition: 'all 0.15s ease'
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png"
            style={{ display: 'none' }}
            onChange={(e) => handleSelectFile(e.target.files[0])}
          />
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-primary-100)', color: 'var(--color-primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
            <Upload size={32} />
          </div>
          <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-2)' }}>
            Kéo thả ảnh tài liệu vào đây hoặc Click để chọn
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', maxWidth: 400, margin: '0 auto var(--space-4)' }}>
            Hệ thống chấp nhận định dạng JPG, JPEG hoặc PNG với dung lượng tối đa 5MB.
          </p>
          <Button variant="secondary" type="button">
            Chọn tệp từ máy tính
          </Button>
        </div>

        {/* Preview Sidebar */}
        {previewUrl && (
          <div className="table-container" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h4 style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={18} color="var(--color-success)" /> Ảnh đã chọn
            </h4>

            <div style={{
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              border: '1px solid var(--border-default)',
              maxHeight: 260,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-muted)'
            }}>
              <img
                src={previewUrl}
                alt="Xem trước ảnh"
                style={{ maxWidth: '100%', maxHeight: 260, objectFit: 'contain' }}
              />
            </div>

            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div>Tên file: <strong>{file?.name}</strong></div>
              <div>Kích thước: <strong>{(file?.size / (1024 * 1024)).toFixed(2)} MB</strong></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'auto' }}>
              <Button
                variant="primary"
                icon={ArrowRight}
                loading={uploading}
                onClick={handleContinue}
              >
                Tiếp tục xử lý ảnh (Bước 2)
              </Button>
              <Button
                variant="ghost"
                onClick={() => { setFile(null); setPreviewUrl(null); }}
              >
                Chọn ảnh khác
              </Button>
            </div>
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
