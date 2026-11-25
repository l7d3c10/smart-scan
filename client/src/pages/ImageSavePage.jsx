import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { documentService } from '../services/document.service.js';
import { imageService } from '../services/image.service.js';
import { Button } from '../components/ui/Button.jsx';
import '../styles/image-processing.css';

const TYPES = [['hoa_don','Hóa đơn'],['hop_dong','Hợp đồng'],['giay_to','Giấy tờ'],['bien_ban','Biên bản'],['khac','Khác']];

export default function ImageSavePage() {
  const { uploadId } = useParams();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [documentId, setDocumentId] = useState('');
  const [form, setForm] = useState({ title: '', type: 'giay_to', description: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { documentService.list({ limit: 100 }).then((data) => setDocuments(data.items || [])).catch(() => setError('Không tải được danh sách tài liệu.')); }, []);

  async function save(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const result = await imageService.save(uploadId, documentId ? { documentId } : form);
      navigate(`/tai-lieu/${result.document.id}`);
    } catch (issue) { setError(issue.message || 'Lưu tài liệu thất bại.'); setBusy(false); }
  }

  return <section className="image-workflow">
    <header className="page-header"><div><h1 className="page-title">Lưu tài liệu</h1><p className="page-desc">Tạo hồ sơ mới hoặc cập nhật ảnh cho hồ sơ có sẵn.</p></div></header>
    <div className="image-steps"><Link to="/xu-ly-anh">1 · Tải ảnh</Link><Link to={`/xu-ly-anh/${uploadId}`}>2 · Xử lý</Link><span className="current">3 · Lưu tài liệu</span></div>
    <form className="image-save-card" onSubmit={save}>
      <label className="image-choice"><input type="radio" checked={!documentId} onChange={() => setDocumentId('')} /> Tạo tài liệu mới</label>
      {!documentId && <div className="image-form-grid">
        <label>Tên tài liệu<input required maxLength="150" className="form-control" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
        <label>Loại tài liệu<select className="form-control" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>{TYPES.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="wide">Mô tả<textarea maxLength="500" className="form-control" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
      </div>}
      <label className="image-choice"><input type="radio" checked={Boolean(documentId)} onChange={() => setDocumentId(documents[0] ? String(documents[0].id) : '')} /> Cập nhật tài liệu có sẵn</label>
      <select className="form-control" disabled={!documentId} value={documentId} onChange={(event) => setDocumentId(event.target.value)}><option value="">Chọn tài liệu…</option>{documents.map((doc) => <option value={doc.id} key={doc.id}>{doc.code} · {doc.title}</option>)}</select>
      {error && <p className="image-error" role="alert">{error}</p>}
      <div className="image-actions"><Button onClick={() => navigate(`/xu-ly-anh/${uploadId}`)}>Quay lại xử lý</Button><Button type="submit" variant="primary" loading={busy} disabled={Boolean(documentId) && !documents.length}>Lưu tài liệu</Button></div>
    </form>
  </section>;
}
