import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImagePlus, UploadCloud } from 'lucide-react';
import { imageService } from '../services/image.service.js';
import { Button } from '../components/ui/Button.jsx';
import '../styles/image-processing.css';

export default function ImageUploadPage() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [activeUpload, setActiveUpload] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('smartscan_active_upload'));
    } catch {
      return null;
    }
  });

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function selectFile(candidate) {
    setError('');
    if (!candidate) return;
    const validType = ['image/jpeg', 'image/png'].includes(candidate.type);
    if (!validType || !/\.(jpe?g|png)$/i.test(candidate.name)) return setError('Chỉ nhận ảnh JPG hoặc PNG.');
    if (candidate.size > 5 * 1024 * 1024) return setError('Ảnh không được vượt quá 5 MB.');
    setFile(candidate);
    setPreview(URL.createObjectURL(candidate));
  }

  async function upload() {
    if (!file) return;
    setBusy(true);
    try {
      const item = await imageService.upload(file);
      sessionStorage.setItem('smartscan_active_upload', JSON.stringify({ id: item.id, name: file.name }));
      navigate(`/xu-ly-anh/${item.id}`);
    } catch (issue) {
      setError(issue.message || 'Tải ảnh thất bại.');
      setBusy(false);
    }
  }

  return <section className="image-workflow">
    <header className="page-header"><div><h1 className="page-title">Tải ảnh tài liệu</h1><p className="page-desc">Chọn ảnh để bắt đầu số hóa bằng SmartScan.</p></div></header>
    <div className="image-steps"><span className="current">1 · Tải ảnh</span><span>2 · Xử lý</span><span>3 · Lưu tài liệu</span></div>

    {activeUpload && (
      <div style={{
        background: 'var(--color-primary-50, #eff6ff)',
        border: '1px solid var(--color-primary-200, #bfdbfe)',
        borderRadius: 'var(--radius-md, 8px)',
        padding: '14px 18px',
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>🖼️</span>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--color-primary-900, #1e3a8a)', fontSize: '14px' }}>
              Bạn đang có ảnh tải lên dở dang: <u>{activeUpload.name || 'Ảnh vừa tải'}</u>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-primary-700, #1d4ed8)', marginTop: '2px' }}>
              Bạn có thể bấm tiếp tục xử lý ảnh này hoặc chọn tải ảnh mới bên dưới.
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/xu-ly-anh/${activeUpload.id}`)}
          >
            Tiếp tục xử lý ảnh này ➜
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              sessionStorage.removeItem('smartscan_active_upload');
              setActiveUpload(null);
            }}
          >
            Bỏ qua
          </Button>
        </div>
      </div>
    )}

    <div className="image-upload-card" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); selectFile(event.dataTransfer.files[0]); }}>
      {preview ? <img className="image-upload-preview" src={preview} alt="Xem trước ảnh tài liệu" /> : <UploadCloud size={42} />}
      <strong>{file ? file.name : 'Kéo ảnh vào đây'}</strong>
      <span>JPG hoặc PNG · tối đa 5 MB</span>
      <Button onClick={() => inputRef.current?.click()} icon={ImagePlus}>Chọn ảnh</Button>
      <input ref={inputRef} hidden type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" onChange={(event) => selectFile(event.target.files[0])} />
    </div>
    {error && <p className="image-error" role="alert">{error}</p>}
    <div className="image-actions"><Button variant="primary" loading={busy} disabled={!file} onClick={upload}>Tải lên và tiếp tục</Button></div>
  </section>;
}
