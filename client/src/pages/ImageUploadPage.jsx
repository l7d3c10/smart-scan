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
      navigate(`/xu-ly-anh/${item.id}`);
    } catch (issue) {
      setError(issue.message || 'Tải ảnh thất bại.');
      setBusy(false);
    }
  }

  return <section className="image-workflow">
    <header className="page-header"><div><h1 className="page-title">Tải ảnh tài liệu</h1><p className="page-desc">Chọn ảnh để bắt đầu số hóa bằng SmartScan.</p></div></header>
    <div className="image-steps"><span className="current">1 · Tải ảnh</span><span>2 · Xử lý</span><span>3 · Lưu tài liệu</span></div>
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
