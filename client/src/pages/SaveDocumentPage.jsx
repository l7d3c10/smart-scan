import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, ArrowLeft, Save, Sparkles, FileText } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Select } from '../components/ui/Select.jsx';
import { useToast } from '../hooks/useToast.js';
import { ToastContainer } from '../components/ui/ToastContainer.jsx';
import { documentService } from '../services/document.service.js';

const TYPE_OPTIONS = [
  { value: 'hoa_don',  label: 'Hóa đơn' },
  { value: 'hop_dong', label: 'Hợp đồng' },
  { value: 'giay_to',  label: 'Giấy tờ' },
  { value: 'bien_ban', label: 'Biên bản' },
  { value: 'khac',     label: 'Khác' },
];

export default function SaveDocumentPage() {
  const { uploadId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const documentId = searchParams.get('documentId');

  const { toasts, removeToast, success: toastSuccess, error: toastError } = useToast();

  const [form, setForm] = useState({
    title: '',
    type: 'hoa_don',
    description: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (documentId) {
      documentService.get(documentId)
        .then((res) => {
          if (res?.data) {
            setForm({
              title: res.data.title || '',
              type: res.data.type || 'hoa_don',
              description: res.data.description || '',
            });
          }
        })
        .catch(() => {});
    }
  }, [documentId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toastError('Vui lòng nhập tên tài liệu.');
      return;
    }

    setSaving(true);
    try {
      if (documentId) {
        // Updating existing document's photo
        await documentService.update(documentId, {
          title: form.title.trim(),
          type: form.type,
          description: form.description.trim(),
        });
        toastSuccess('Đã cập nhật ảnh thành công cho tài liệu!');
        setTimeout(() => navigate(`/tai-lieu/${documentId}`), 1000);
      } else {
        // Creating new document
        const res = await documentService.create({
          title: form.title.trim(),
          type: form.type,
          description: form.description.trim(),
        });
        toastSuccess(`Đã lưu tài liệu mới: ${res.data?.code || ''}`);
        setTimeout(() => navigate(`/tai-lieu/${res.data?.id || ''}`), 1000);
      }
    } catch (err) {
      toastError(err.message || 'Lưu tài liệu thất bại.');
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Bước 3: Lưu trữ hồ sơ tài liệu</h1>
        <p className="page-desc">
          {documentId ? `Cập nhật ảnh đã xử lý cho tài liệu #${documentId}` : 'Điền thông tin định danh để lưu trữ và quản lý hồ sơ'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-6)', alignItems: 'start' }}>
        {/* Form */}
        <div className="table-container" style={{ padding: 'var(--space-6)' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              <div>
                <label className="form-label" htmlFor="title">
                  Tên tài liệu <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  id="title"
                  className="form-control"
                  placeholder="Ví dụ: Hóa đơn điện tử tháng 11/2026..."
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  maxLength={150}
                  required
                />
              </div>

              <Select
                id="type"
                label="Loại tài liệu"
                required
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>

              <div>
                <label className="form-label" htmlFor="description">
                  Mô tả nội dung (Tùy chọn)
                </label>
                <textarea
                  id="description"
                  className="form-control form-textarea"
                  placeholder="Thông tin tóm tắt nội dung tài liệu..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  maxLength={500}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-default)' }}>
                <Button variant="ghost" type="button" onClick={() => navigate(`/tai-len/${uploadId}/xu-ly`)}>
                  <ArrowLeft size={16} /> Quay lại Bước 2
                </Button>
                <Button variant="primary" type="submit" icon={Save} loading={saving}>
                  {documentId ? 'Lưu cập nhật' : 'Hoàn tất và Lưu tài liệu'}
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* Thumbnail preview */}
        <div className="table-container" style={{ padding: 'var(--space-5)', textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Ảnh tài liệu đã xử lý
          </h4>
          <div style={{ minHeight: 220, background: 'var(--bg-muted)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-3)', border: '1px solid var(--border-default)' }}>
            <FileText size={48} color="var(--color-primary-500)" />
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', display: 'block', marginTop: 'var(--space-2)' }}>
            ✓ Sẵn sàng lưu vào hệ thống
          </span>
        </div>
      </div>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
