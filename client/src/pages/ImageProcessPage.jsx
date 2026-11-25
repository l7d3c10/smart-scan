import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight, ArrowLeft, Sliders, Sparkles, CheckCircle,
  Eye, RefreshCw, ZoomIn, Info, AlertTriangle
} from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { useToast } from '../hooks/useToast.js';
import { ToastContainer } from '../components/ui/ToastContainer.jsx';

export default function ImageProcessPage() {
  const { uploadId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const documentId = searchParams.get('documentId');

  const { toasts, removeToast, success: toastSuccess } = useToast();

  const [mode, setMode] = useState('bw'); // 'color' | 'gray' | 'bw'
  const [cannyLow, setCannyLow] = useState(50);
  const [cannyHigh, setCannyHigh] = useState(150);
  const [kernel, setKernel] = useState(5);
  const [blockSize, setBlockSize] = useState(11);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleProcess = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      toastSuccess('Đã xử lý nắn thẳng và làm rõ ảnh thành công!');
    }, 1200);
  };

  const handleNext = () => {
    navigate(`/tai-len/${uploadId}/luu${documentId ? `?documentId=${documentId}` : ''}`);
  };

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Bước 2: Xử lý ảnh tài liệu (OpenCV)</h1>
          <p className="page-desc">Tự động tìm 4 góc tờ giấy, nắn thẳng phối cảnh và khử bóng/làm rõ chữ</p>
        </div>
        <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/tai-len')}>
          Quay lại tải ảnh
        </Button>
      </div>

      {/* Mode selection cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
        {[
          { key: 'color', label: '1. Giữ màu nguyên bản', desc: 'Nắn thẳng phối cảnh nhưng giữ nguyên màu gốc (phù hợp hóa đơn đỏ, chứng thư).' },
          { key: 'gray', label: '2. Ảnh xám (Grayscale)', desc: 'Chuyển về thang xám, làm nét viền chữ, giảm bớt vết bẩn nền.' },
          { key: 'bw', label: '3. Đen trắng (Adaptive)', desc: 'Khử sạch bóng đổ, nền trắng tinh, chữ đen sắc nét chuẩn scan tài liệu văn phòng.' },
        ].map((m) => {
          const isSelected = mode === m.key;
          return (
            <div
              key={m.key}
              onClick={() => setMode(m.key)}
              style={{
                border: `2px solid ${isSelected ? 'var(--color-primary-600)' : 'var(--border-default)'}`,
                background: isSelected ? 'var(--color-primary-50)' : 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                <span style={{ fontWeight: 'var(--weight-bold)', color: isSelected ? 'var(--color-primary-800)' : 'var(--text-primary)' }}>
                  {m.label}
                </span>
                {isSelected && <CheckCircle size={18} color="var(--color-primary-600)" />}
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                {m.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Advanced Settings Toggle */}
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <button
          className="btn btn-ghost btn-sm"
          type="button"
          onClick={() => setShowAdvanced((prev) => !prev)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 'var(--weight-semibold)' }}
        >
          <Sliders size={15} />
          {showAdvanced ? 'Thu gọn tùy chỉnh thuật toán nâng cao' : 'Mở tùy chỉnh thuật toán Canny & Adaptive Threshold (Nâng cao)'}
        </button>

        {showAdvanced && (
          <div className="table-container" style={{ padding: 'var(--space-4)', marginTop: 'var(--space-3)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>Ngưỡng Canny thấp: {cannyLow}</label>
              <input type="range" min="10" max="100" value={cannyLow} onChange={(e) => setCannyLow(Number(e.target.value))} style={{ width: '100%' }} />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Mặc định: 50</span>
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>Ngưỡng Canny cao: {cannyHigh}</label>
              <input type="range" min="100" max="255" value={cannyHigh} onChange={(e) => setCannyHigh(Number(e.target.value))} style={{ width: '100%' }} />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Mặc định: 150</span>
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>Gaussian Kernel: {kernel}x{kernel}</label>
              <input type="range" min="3" max="11" step="2" value={kernel} onChange={(e) => setKernel(Number(e.target.value))} style={{ width: '100%' }} />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Làm mịn giảm nhiễu (số lẻ)</span>
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>Block Size (BW): {blockSize}</label>
              <input type="range" min="3" max="51" step="2" value={blockSize} onChange={(e) => setBlockSize(Number(e.target.value))} style={{ width: '100%' }} />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Vùng tính ngưỡng cục bộ</span>
            </div>
          </div>
        )}
      </div>

      {/* Comparison View: Original vs Result */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)', marginBottom: 'var(--space-5)' }}>
        {/* Left: Original */}
        <div className="table-container" style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            📷 Ảnh chụp gốc (Góc nghiêng / Ánh sáng tự nhiên)
          </h4>
          <div style={{ minHeight: 320, background: 'var(--bg-muted)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-3)' }}>
            <img
              src={`/api/uploads/${uploadId}/original`}
              alt="Ảnh gốc"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
              style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 'var(--radius-sm)' }}
            />
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              Ảnh gốc chụp từ thiết bị
            </div>
          </div>
        </div>

        {/* Right: OpenCV Result */}
        <div className="table-container" style={{ padding: 'var(--space-4)', textAlign: 'center', border: '2px solid var(--color-primary-200)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-primary-700)', fontWeight: 'var(--weight-bold)' }}>
              ✨ Kết quả xử lý nắn thẳng & làm rõ ({mode.toUpperCase()})
            </h4>
            <Button size="sm" variant="secondary" icon={RefreshCw} loading={processing} onClick={handleProcess}>
              Xử lý lại
            </Button>
          </div>
          <div style={{ minHeight: 320, background: '#fff', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-3)', border: '1px dashed var(--border-default)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 180, height: 240, border: '1px solid #ddd', margin: '0 auto var(--space-3)', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: '#444', fontWeight: 'bold' }}>
                  [Tài liệu sau nắn góc - {mode === 'bw' ? 'Trắng đen' : mode === 'gray' ? 'Thang xám' : 'Màu'}]
                </span>
              </div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', fontWeight: 'bold' }}>
                ✓ Đã tìm thấy viền 4 đỉnh & áp dụng Warp Perspective
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Intermediate OpenCV Steps Strip */}
      <div className="table-container" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
        <h4 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          4 Bước trung gian thuật toán OpenCV:
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)' }}>
          {[
            { step: 1, title: '1. Grayscale & Blur', desc: 'Chuyển xám và làm mịn lọc nhiễu' },
            { step: 2, title: '2. Canny Edges', desc: 'Bắt biên cạnh tài liệu' },
            { step: 3, title: '3. Find Contour', desc: 'Khoanh 4 góc viền giấy màu xanh lá' },
            { step: 4, title: '4. Warp Transform', desc: 'Nắn phẳng thành khung chữ nhật' },
          ].map((s) => (
            <div key={s.step} style={{ background: 'var(--bg-muted)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ height: 90, background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                Ảnh bước #{s.step}
              </div>
              <div style={{ fontWeight: 'bold', fontSize: 'var(--text-xs)' }}>{s.title}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Navigation */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
        <Button variant="primary" icon={ArrowRight} onClick={handleNext}>
          Tiếp tục sang Bước 3: Lưu thông tin tài liệu
        </Button>
      </div>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
