import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, ImagePlus, RefreshCw, UploadCloud } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { documentService } from '../../services/document.service.js';
import { imageService } from '../../services/image.service.js';
import '../../styles/image-processing.css';

const DEFAULTS = { mode: 'color', cannyLow: 50, cannyHigh: 150, kernel: 5, blockSize: 11 };
const LABELS = ['Ảnh xám và làm mờ', 'Cạnh Canny', 'Viền tài liệu', 'Ảnh sau nắn'];

function readActiveDraft() {
  try { return JSON.parse(sessionStorage.getItem('smartscan_active_upload') || 'null'); }
  catch { return null; }
}

function rememberDraftOptions(id, options) {
  const active = readActiveDraft();
  if (String(active?.id) !== String(id)) return;
  const { mode, ...params } = options;
  sessionStorage.setItem('smartscan_active_upload', JSON.stringify({ ...active, mode, params }));
}

export function DocumentImageField({ mode, documentId, initialData, initialDraftId, onChange, onBusyChange }) {
  const inputRef = useRef(null);
  const requestId = useRef(0);
  const initialized = useRef(false);
  const [draftId, setDraftId] = useState(initialDraftId || (!initialData ? readActiveDraft()?.id : '') || '');
  const [options, setOptions] = useState(DEFAULTS);
  const [result, setResult] = useState(null);
  const [originalUrl, setOriginalUrl] = useState('');
  const [images, setImages] = useState([]);
  const [sourceId, setSourceId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  const publish = useCallback((nextDraftId, nextSourceId) => {
    onChange({ imageDraftId: nextDraftId || '', imageSourceId: nextSourceId || '' });
  }, [onChange]);

  useEffect(() => {
    let active = true;
    documentService.processedImages().then((data) => {
      if (active) setImages(data || []);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!draftId) { initialized.current = true; return; }
    let active = true;
    imageService.draft(draftId).then((draft) => {
      if (!active) return;
      setOriginalUrl(draft.originalUrl || '');
      if (draft.mode && draft.params) {
        const cached = readActiveDraft();
        const cachedOptions = String(cached?.id) === String(draftId) && cached.params
          ? { ...cached.params, mode: cached.mode || draft.mode }
          : {};
        setOptions({ ...DEFAULTS, ...draft.params, ...cachedOptions, mode: cachedOptions.mode || draft.mode });
      }
      if (draft.resultUrl) {
        setResult({
          found: draft.warning == null, warning: draft.warning,
          resultUrl: draft.resultUrl, steps: draft.steps || [],
        });
        publish(draftId, '');
      }
      initialized.current = true;
    }).catch((issue) => {
      if (active) { setError(issue.message || 'Không khôi phục được ảnh nháp.'); initialized.current = true; }
    });
    return () => { active = false; };
  }, [draftId, publish]);

  const processImage = useCallback(async (id = draftId, nextOptions = options) => {
    if (!id) return;
    const request = ++requestId.current;
    setBusy(true); setError('');
    onBusyChange(true);
    try {
      const processed = await imageService.process(id, nextOptions);
      if (request === requestId.current) { setResult(processed); publish(id, ''); }
    } catch (issue) {
      if (request === requestId.current) setError(issue.message || 'Không thể xử lý ảnh.');
    } finally {
      if (request === requestId.current) { setBusy(false); onBusyChange(false); }
    }
  }, [draftId, options, onBusyChange, publish]);

  useEffect(() => {
    if (!initialized.current || revision === 0 || !draftId) return undefined;
    const timer = window.setTimeout(() => processImage(), 450);
    return () => window.clearTimeout(timer);
  }, [revision, draftId, processImage]);

  async function handleFile(file) {
    if (!file) return;
    const valid = ['image/jpeg', 'image/png'].includes(file.type) && /\.(jpe?g|png)$/i.test(file.name);
    if (!valid || file.size > 5 * 1024 * 1024) {
      setError(!valid ? 'Chỉ nhận ảnh JPG hoặc PNG.' : 'Ảnh không được vượt quá 5 MB.');
      return;
    }
    setBusy(true); onBusyChange(true); setError(''); setResult(null); setOriginalUrl(''); setSourceId(''); publish('', '');
    try {
      const uploaded = await imageService.upload(file);
      setDraftId(uploaded.id);
      sessionStorage.setItem('smartscan_active_upload', JSON.stringify({ id: uploaded.id, name: file.name, mode: options.mode, params: { cannyLow: options.cannyLow, cannyHigh: options.cannyHigh, kernel: options.kernel, blockSize: options.blockSize } }));
      initialized.current = true;
      await processImage(uploaded.id, options);
    } catch (issue) {
      setError(issue.message || 'Tải ảnh thất bại.');
      setBusy(false);
      onBusyChange(false);
    }
  }

  function changeOption(key, value) {
    requestId.current += 1;
    const next = { ...options, [key]: value };
    if (key === 'cannyLow') next.cannyHigh = Math.max(next.cannyHigh, value + 1);
    if (key === 'cannyHigh') next.cannyLow = Math.min(next.cannyLow, value - 1);
    setOptions(next);
    rememberDraftOptions(draftId, next);
    if (draftId) {
      setResult(null);
      setBusy(true);
      onBusyChange(true);
      setError('');
      publish('', '');
      setRevision((number) => number + 1);
    }
  }

  function changeMode(mode) {
    requestId.current += 1;
    const next = { ...options, mode };
    setOptions(next);
    rememberDraftOptions(draftId, next);
    setResult(null);
    setBusy(true);
    onBusyChange(true);
    setError('');
    publish('', '');
    setRevision((number) => number + 1);
  }

  function chooseExisting(id) {
    setSourceId(id);
    if (id) {
      setDraftId(''); setResult(null);
      sessionStorage.removeItem('smartscan_active_upload');
      publish('', id);
    } else publish('', '');
  }

  const currentImage = sourceId
    ? images.find((image) => String(image.id) === String(sourceId))?.imageUrl
    : result?.resultUrl || (initialData?.processed_path ? `/api/documents/${documentId}/image/processed` : '');

  return <section className="document-image-field">
    <div className="form-group">
      <label className="form-label">Ảnh tài liệu</label>
      {initialData?.processed_path && !draftId && !sourceId && <div className="document-image-result"><img className="document-image-preview" src={`/api/documents/${documentId}/image/processed`} alt="Ảnh đã xử lý hiện tại" /><a className="btn btn-secondary btn-sm" href={`/api/documents/${documentId}/image/processed?download=1`}><Download size={14} /> Tải ảnh về</a></div>}
      <div className="document-image-actions">
        <Button type="button" variant="secondary" icon={ImagePlus} onClick={() => inputRef.current?.click()}>Tải ảnh mới</Button>
        <select className="form-control" value={sourceId} onChange={(event) => chooseExisting(event.target.value)}>
          <option value="">Chọn ảnh đã xử lý trong SmartScan…</option>
          {images.map((image) => <option key={image.id} value={image.id}>{image.code} · {image.title}</option>)}
        </select>
      </div>
      <input ref={inputRef} hidden type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" onChange={(event) => handleFile(event.target.files[0])} />
      {!draftId && !sourceId && !initialData?.processed_path && <div className="document-image-drop" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); handleFile(event.dataTransfer.files[0]); }}><UploadCloud size={26} /><span>Kéo ảnh vào đây hoặc bấm “Tải ảnh mới” · JPG/PNG tối đa 5 MB</span></div>}
    </div>
    {draftId && <div className="document-image-editor">
      <div className="image-mode-grid">{[['color','Màu'],['gray','Xám'],['bw','Đen trắng']].map(([value,label]) => <button type="button" key={value} className={`image-mode ${options.mode === value ? 'selected' : ''}`} onClick={() => changeMode(value)}>{label}</button>)}</div>
      <div className="document-image-sliders">{[['cannyLow','Ngưỡng Canny thấp',0,254,1],['cannyHigh','Ngưỡng Canny cao',1,255,1],['kernel','Kernel Gaussian',3,11,2],['blockSize','Adaptive threshold',3,51,2]].map(([key,label,min,max,step]) => <label key={key}><span>{label}<b>{options[key]}</b></span><input type="range" min={min} max={max} step={step} value={options[key]} onChange={(event) => changeOption(key, Number(event.target.value))} /></label>)}</div>
      {busy && <p role="status">Đang xử lý ảnh…</p>}
      {result?.warning && <p className="image-warning" role="status">{result.warning}</p>}
      {error && <p className="image-error" role="alert">{error}</p>}
      {originalUrl && !currentImage && <div className="document-image-result"><img src={originalUrl} alt="Ảnh gốc đã tải lên" /></div>}
      {currentImage && <div className="document-image-result"><img src={currentImage} alt="Ảnh đã xử lý" /><a className="btn btn-secondary btn-sm" href={draftId ? `/api/uploads/${draftId}/processed?download=1` : images.find((image) => String(image.id) === String(sourceId))?.downloadUrl || `/api/documents/${documentId}/image/processed?download=1`}><Download size={14} /> Tải ảnh về</a></div>}
      {result?.steps?.length > 0 && <div className="image-step-grid">{result.steps.map((step, index) => <figure key={step.url}><img src={step.url} alt={step.label || LABELS[index]} /><figcaption>{step.label || LABELS[index]}</figcaption></figure>)}</div>}
      <Button type="button" variant="secondary" icon={RefreshCw} loading={busy} onClick={() => processImage()}>Xử lý lại</Button>
    </div>}
    {sourceId && currentImage && <div className="document-image-result"><img src={currentImage} alt="Ảnh đã chọn" /><a className="btn btn-secondary btn-sm" href={images.find((image) => String(image.id) === String(sourceId))?.downloadUrl}><Download size={14} /> Tải ảnh về</a></div>}
    {error && !draftId && <p className="image-error" role="alert">{error}</p>}
    <p className="image-field-hint">Không chọn ảnh mới thì ảnh hiện tại của tài liệu được giữ nguyên.</p>
  </section>;
}
