import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { imageService } from '../services/image.service.js';
import { Button } from '../components/ui/Button.jsx';
import '../styles/image-processing.css';

const DEFAULTS = { mode: 'color', cannyLow: 50, cannyHigh: 150, kernel: 5, blockSize: 11 };

function readActiveUpload() {
  try { return JSON.parse(sessionStorage.getItem('smartscan_active_upload') || 'null'); }
  catch { return null; }
}

function rememberOptions(uploadId, options) {
  const active = readActiveUpload();
  if (String(active?.id) !== String(uploadId)) return;
  const { mode, ...params } = options;
  sessionStorage.setItem('smartscan_active_upload', JSON.stringify({ ...active, mode, params }));
}

export default function ImageProcessPage() {
  const { uploadId } = useParams();
  const navigate = useNavigate();
  const [options, setOptions] = useState(DEFAULTS);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [compare, setCompare] = useState(50);
  const [revision, setRevision] = useState(0);
  const requestId = useRef(0);
  const original = `/api/uploads/${uploadId}/original`;

  async function process() {
    const currentRequest = ++requestId.current;
    setBusy(true); setError('');
    try {
      const next = await imageService.process(uploadId, options);
      if (currentRequest === requestId.current) setResult(next);
    } catch (issue) { if (currentRequest === requestId.current) setError(issue.message || 'Không thể xử lý ảnh.'); }
    finally { if (currentRequest === requestId.current) setBusy(false); }
  }

  function markOptionsChanged() {
    requestId.current += 1;
    setResult(null);
    setBusy(true);
    setError('');
    setRevision((number) => number + 1);
  }

  useEffect(() => {
    if (revision === 0) return undefined;
    const timer = window.setTimeout(process, 450);
    return () => window.clearTimeout(timer);
  }, [revision, options]);

  useEffect(() => {
    if (uploadId) {
      const saved = readActiveUpload();
      if (!saved) {
        sessionStorage.setItem('smartscan_active_upload', JSON.stringify({ id: uploadId, name: `Tải lên #${uploadId}` }));
      }
    }
      imageService.draft(uploadId).then((draft) => {
        if (draft.mode && draft.params) {
          const cached = readActiveUpload();
          const cachedOptions = String(cached?.id) === String(uploadId) && cached.params
            ? { ...cached.params, mode: cached.mode || draft.mode }
            : {};
          setOptions({ ...DEFAULTS, ...draft.params, ...cachedOptions, mode: cachedOptions.mode || draft.mode });
        }
        if (draft.resultUrl) setResult({ warning: draft.warning, resultUrl: draft.resultUrl, steps: draft.steps || [] });
      }).catch((issue) => setError(issue.message || 'Không khôi phục được ảnh nháp.'));
  }, [uploadId]);

  return <section className="image-workflow">
    <header className="page-header"><div><h1 className="page-title">Xử lý ảnh</h1><p className="page-desc">Chọn chế độ, điều chỉnh phát hiện viền và xem kết quả.</p></div><Button onClick={() => navigate(`/tai-lieu/them?draftId=${uploadId}`)}>Quay lại form tài liệu</Button></header>
    <div className="image-steps"><Link to="/xu-ly-anh">1 · Tải ảnh</Link><span className="current">2 · Xử lý</span><span>3 · Lưu tài liệu</span></div>
    <div className="image-mode-grid">{[['color','Màu gốc'],['gray','Thang xám'],['bw','Đen trắng']].map(([value,label]) => <button key={value} className={`image-mode ${options.mode === value ? 'selected' : ''}`} onClick={() => { const next = { ...options, mode: value }; setOptions(next); rememberOptions(uploadId, next); markOptionsChanged(); }}>{label}</button>)}</div>
    <div className="image-controls">
      {[['cannyLow','Ngưỡng Canny thấp',0,254,1],['cannyHigh','Ngưỡng Canny cao',1,255,1],['kernel','Kernel Gaussian',3,11,2],['blockSize','Adaptive threshold',3,51,2]].map(([key,label,min,max,step]) => <label key={key} className="image-slider"><span>{label}<b>{options[key]}</b></span><input type="range" min={min} max={max} step={step} value={options[key]} onChange={(event) => {
        const value = Number(event.target.value);
        setOptions((state) => {
          if (key === 'cannyLow') return { ...state, cannyLow: value, cannyHigh: Math.max(state.cannyHigh, value + 1) };
          if (key === 'cannyHigh') return { ...state, cannyHigh: value, cannyLow: Math.min(state.cannyLow, value - 1) };
          return { ...state, [key]: value };
        });
        const next = { ...options, [key]: value };
        if (key === 'cannyLow') next.cannyHigh = Math.max(next.cannyHigh, value + 1);
        if (key === 'cannyHigh') next.cannyLow = Math.min(next.cannyLow, value - 1);
        rememberOptions(uploadId, next);
        markOptionsChanged();
      }} /></label>)}
      <Button variant="primary" loading={busy} onClick={process}>Xử lý lại</Button>
    </div>
    {error && <p className="image-error" role="alert">{error}</p>}
    {result && <>
      {result.warning && <p className="image-warning" role="status">{result.warning}</p>}
      <div className="image-compare" style={{ '--compare': `${compare}%` }}><img src={original} alt="Ảnh gốc" /><img className="processed" src={result.resultUrl} alt="Ảnh sau xử lý" /><input aria-label="So sánh ảnh gốc và kết quả" type="range" min="0" max="100" value={compare} onChange={(event) => setCompare(Number(event.target.value))} /></div>
      <a className="btn btn-secondary btn-sm" href={`/api/uploads/${uploadId}/processed?download=1`}>Tải ảnh đã xử lý về</a>
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
