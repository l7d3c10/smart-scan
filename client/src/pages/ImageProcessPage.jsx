import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { imageService } from '../services/image.service.js';
import { Button } from '../components/ui/Button.jsx';
import '../styles/image-processing.css';

const DEFAULTS = { mode: 'color', cannyLow: 50, cannyHigh: 150, kernel: 5, blockSize: 11 };

export default function ImageProcessPage() {
  const { uploadId } = useParams();
  const navigate = useNavigate();
  const [options, setOptions] = useState(DEFAULTS);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [compare, setCompare] = useState(50);
  const original = `/api/uploads/${uploadId}/original`;

  async function process() {
    setBusy(true); setError('');
    try { setResult(await imageService.process(uploadId, options)); }
    catch (issue) { setError(issue.message || 'Không thể xử lý ảnh.'); }
    finally { setBusy(false); }
  }

  useEffect(() => {
    if (uploadId) {
      const saved = sessionStorage.getItem('smartscan_active_upload');
      if (!saved) {
        sessionStorage.setItem('smartscan_active_upload', JSON.stringify({ id: uploadId, name: `Tải lên #${uploadId}` }));
      }
    }
    process();
  }, [uploadId]);

  return <section className="image-workflow">
    <header className="page-header"><div><h1 className="page-title">Xử lý ảnh</h1><p className="page-desc">Chọn chế độ, điều chỉnh phát hiện viền và xem kết quả.</p></div></header>
    <div className="image-steps"><Link to="/xu-ly-anh">1 · Tải ảnh</Link><span className="current">2 · Xử lý</span><span>3 · Lưu tài liệu</span></div>
    <div className="image-mode-grid">{[['color','Màu gốc'],['gray','Thang xám'],['bw','Đen trắng']].map(([value,label]) => <button key={value} className={`image-mode ${options.mode === value ? 'selected' : ''}`} onClick={() => setOptions((state) => ({ ...state, mode: value }))}>{label}</button>)}</div>
    <div className="image-controls">
      {[['cannyLow','Ngưỡng Canny thấp',0,254,1],['cannyHigh','Ngưỡng Canny cao',1,255,1],['kernel','Kernel Gaussian',3,11,2],['blockSize','Adaptive threshold',3,51,2]].map(([key,label,min,max,step]) => <label key={key} className="image-slider"><span>{label}<b>{options[key]}</b></span><input type="range" min={min} max={max} step={step} value={options[key]} onChange={(event) => setOptions((state) => {
        const value = Number(event.target.value);
        if (key === 'cannyLow') return { ...state, cannyLow: value, cannyHigh: Math.max(state.cannyHigh, value + 1) };
        if (key === 'cannyHigh') return { ...state, cannyHigh: value, cannyLow: Math.min(state.cannyLow, value - 1) };
        return { ...state, [key]: value };
      })} /></label>)}
      <Button variant="primary" loading={busy} onClick={process}>Xử lý lại</Button>
    </div>
    {error && <p className="image-error" role="alert">{error}</p>}
    {result && <>
      {result.warning && <p className="image-warning" role="status">{result.warning}</p>}
      <div className="image-compare" style={{ '--compare': `${compare}%` }}><img src={original} alt="Ảnh gốc" /><img className="processed" src={result.resultUrl} alt="Ảnh sau xử lý" /><input aria-label="So sánh ảnh gốc và kết quả" type="range" min="0" max="100" value={compare} onChange={(event) => setCompare(Number(event.target.value))} /></div>
      <div className="image-step-grid">{result.steps.map((step) => <figure key={step.url}><img src={step.url} alt={step.label} /><figcaption>{step.label}</figcaption></figure>)}</div>
      <div className="image-actions">
        <Button onClick={() => {
          sessionStorage.removeItem('smartscan_active_upload');
          navigate('/xu-ly-anh');
        }}>
          Chọn ảnh khác
        </Button>
        <Button variant="primary" onClick={() => navigate(`/xu-ly-anh/${uploadId}/luu`)}>
          Tiếp tục lưu
        </Button>
      </div>
    </>}
  </section>;
}
