import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Upload, FileSpreadsheet, CheckCircle2,
  AlertCircle, Download, FileText, RefreshCw
} from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { useToast } from '../hooks/useToast.js';
import { ToastContainer } from '../components/ui/ToastContainer.jsx';
import { documentService } from '../services/document.service.js';
import { Alert } from '../components/ui/Alert.jsx';

const VALID_TYPES = ['hoa_don', 'hop_dong', 'giay_to', 'bien_ban', 'khac'];

export default function DocumentImportPage() {
  const navigate = useNavigate();
  const { toasts, removeToast, success: toastSuccess, error: toastError } = useToast();

  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [previewRows, setPreviewRows] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [validItems, setValidItems] = useState([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  // Parse raw text into structured data (supports JSON and CSV)
  const processRawData = (items) => {
    const errors = [];
    const valid = [];

    items.forEach((item, idx) => {
      const rowNum = idx + 1;
      const title = String(item.title || item['Tiêu đề'] || item['Tên tài liệu'] || '').trim();
      let type = String(item.type || item['Loại'] || item['Loại tài liệu'] || '').trim().toLowerCase();
      const description = String(item.description || item['Mô tả'] || '').trim();

      // Normalize common Vietnamese type names
      if (type === 'hóa đơn' || type === 'hoa don') type = 'hoa_don';
      else if (type === 'hợp đồng' || type === 'hop dong') type = 'hop_dong';
      else if (type === 'giấy tờ' || type === 'giay to') type = 'giay_to';
      else if (type === 'biên bản' || type === 'bien ban') type = 'bien_ban';
      else if (type === 'khác' || type === 'khac') type = 'khac';

      const rowErrors = [];
      if (!title) {
        rowErrors.push('Tiêu đề không được để trống');
      } else if (title.length > 150) {
        rowErrors.push('Tiêu đề dài quá 150 ký tự');
      }

      if (!VALID_TYPES.includes(type)) {
        rowErrors.push(`Loại tài liệu "${type || '(trống)'}" không hợp lệ (hợp lệ: hoa_don, hop_dong, giay_to, bien_ban, khac)`);
      }

      if (description.length > 500) {
        rowErrors.push('Mô tả vượt quá 500 ký tự');
      }

      if (rowErrors.length > 0) {
        errors.push({ row: rowNum, title: title || '(Trống)', errors: rowErrors });
      } else {
        valid.push({ title, type, description });
      }
    });

    setParsedData(items);
    setPreviewRows(items.slice(0, 5));
    setValidationErrors(errors);
    setValidItems(valid);
  };

  const handleFile = (uploadedFile) => {
    if (!uploadedFile) return;

    if (uploadedFile.size > 2 * 1024 * 1024) {
      toastError('File vượt quá giới hạn 2MB.');
      return;
    }

    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        if (uploadedFile.name.endsWith('.json')) {
          const json = JSON.parse(content);
          if (!Array.isArray(json)) {
            throw new Error('File JSON phải là một mảng danh sách tài liệu.');
          }
          processRawData(json);
        } else if (uploadedFile.name.endsWith('.csv') || uploadedFile.name.endsWith('.txt')) {
          // Simple CSV parser
          const lines = content.split('\n').filter(Boolean);
          if (lines.length < 2) throw new Error('File CSV không có dữ liệu.');
          const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
          const rows = lines.slice(1).map((line) => {
            const values = line.split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
            const obj = {};
            headers.forEach((h, i) => {
              obj[h] = values[i] || '';
            });
            return obj;
          });
          processRawData(rows);
        } else {
          // Default fallback
          toastError('Hỗ trợ tốt nhất định dạng JSON và CSV. Vui lòng tải file mẫu để kiểm tra.');
        }
      } catch (err) {
        toastError(err.message || 'Lỗi đọc nội dung file.');
        setFile(null);
        setParsedData([]);
      }
    };

    reader.readAsText(uploadedFile);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleImport = async () => {
    if (validItems.length === 0) return;
    setImporting(true);
    try {
      const res = await documentService.import(validItems);
      toastSuccess(`Đã nhập thành công ${res.data.insertedCount} tài liệu!`);
      setTimeout(() => navigate('/tai-lieu'), 1200);
    } catch (err) {
      toastError(err.message || 'Nhập dữ liệu thất bại.');
      setImporting(false);
    }
  };

  // Sample templates download
  const downloadSampleJson = () => {
    const sample = [
      {
        title: "Hóa đơn dịch vụ đám mây AWS tháng 11/2026",
        type: "hoa_don",
        description: "Hóa đơn chi phí hạ tầng máy chủ và lưu trữ đám mây"
      },
      {
        title: "Hợp đồng bảo trì hệ thống phần mềm 2026",
        type: "hop_dong",
        description: "Hợp đồng dịch vụ bảo trì định kỳ hệ thống ERP"
      },
      {
        title: "Biên bản bàn giao thiết bị phòng máy chủ",
        type: "bien_ban",
        description: "Bàn giao thiết bị Switch Cisco và tủ rack 42U"
      }
    ];
    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'smartscan_sample_import.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Nhập danh sách tài liệu từ File (Excel / JSON)</h1>
          <p className="page-desc">Hỗ trợ nhập hàng loạt tài liệu nhanh chóng kèm kiểm tra tính hợp lệ dữ liệu</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="secondary" icon={Download} onClick={downloadSampleJson}>
            Tải file mẫu JSON
          </Button>
          <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/tai-lieu')}>
            Quay lại
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-5)' }}>
        {/* Upload Dropzone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragActive ? 'var(--color-primary-500)' : 'var(--border-strong)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-8)',
            textAlign: 'center',
            backgroundColor: dragActive ? 'var(--color-primary-50)' : 'var(--bg-surface)',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.csv,.xlsx,.txt"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files[0])}
          />
          <FileSpreadsheet size={48} color="var(--color-primary-600)" style={{ margin: '0 auto var(--space-3)' }} />
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', margin: '0 0 var(--space-2)' }}>
            {file ? `Đã chọn file: ${file.name}` : 'Kéo thả file vào đây hoặc bấm để chọn'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
            Hỗ trợ file định dạng <strong>.json, .csv, .xlsx</strong> (Tối đa 2MB, tối đa 500 dòng)
          </p>
        </div>

        {/* Validation and Preview Area */}
        {parsedData.length > 0 && (
          <div className="table-container" style={{ padding: 'var(--space-5)' }}>
            {/* Stat counters */}
            <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
              <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--bg-muted)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Tổng số dòng đọc được:</span>
                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold' }}>{parsedData.length}</div>
              </div>

              <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-success-bg)', color: 'var(--color-success-text)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: 'var(--text-xs)' }}>Dòng hợp lệ sẵn sàng nhập:</span>
                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold' }}>{validItems.length}</div>
              </div>

              {validationErrors.length > 0 && (
                <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-danger-bg)', color: 'var(--color-danger-text)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: 'var(--text-xs)' }}>Dòng bị lỗi cần sửa:</span>
                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold' }}>{validationErrors.length}</div>
                </div>
              )}
            </div>

            {/* Error table if any */}
            {validationErrors.length > 0 && (
              <div style={{ marginBottom: 'var(--space-5)' }}>
                <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 'var(--space-2)' }}>
                  <AlertCircle size={16} /> Chi tiết các dòng dữ liệu không hợp lệ ({validationErrors.length}):
                </h4>
                <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--color-danger-border)', borderRadius: 'var(--radius-md)' }}>
                  <table className="data-table" style={{ margin: 0, fontSize: 'var(--text-xs)' }}>
                    <thead>
                      <tr>
                        <th style={{ width: 60 }}>Dòng</th>
                        <th>Tiêu đề dữ liệu</th>
                        <th>Lỗi phát hiện</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validationErrors.map((err, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 'bold' }}>#{err.row}</td>
                          <td>{err.title}</td>
                          <td style={{ color: 'var(--color-danger)' }}>{err.errors.join('; ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Preview table (first 5 rows) */}
            <div style={{ marginBottom: 'var(--space-5)' }}>
              <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-2)' }}>
                Xem trước 5 dòng đầu tiên:
              </h4>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Tên tài liệu</th>
                    <th>Loại</th>
                    <th>Mô tả</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((r, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td style={{ fontWeight: 'var(--weight-medium)' }}>{r.title || r['Tiêu đề'] || '—'}</td>
                      <td><code>{r.type || r['Loại'] || '—'}</code></td>
                      <td style={{ color: 'var(--text-secondary)' }}>{r.description || r['Mô tả'] || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Import Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button variant="secondary" onClick={() => { setFile(null); setParsedData([]); }}>
                Chọn lại file khác
              </Button>
              <Button
                variant="primary"
                icon={CheckCircle2}
                disabled={validItems.length === 0}
                loading={importing}
                onClick={handleImport}
              >
                Nhập {validItems.length} dòng hợp lệ vào cơ sở dữ liệu
              </Button>
            </div>
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
