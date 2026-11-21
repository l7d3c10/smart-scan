import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { documentService } from '../services/document.service.js';
import { useToast } from '../hooks/useToast.js';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Select } from '../components/ui/Select.jsx';
import { ToastContainer } from '../components/ui/ToastContainer.jsx';

const TYPE_OPTIONS = [
  { value: 'hoa_don',  label: 'Hóa đơn' },
  { value: 'hop_dong', label: 'Hợp đồng' },
  { value: 'giay_to',  label: 'Giấy tờ' },
  { value: 'bien_ban', label: 'Biên bản' },
  { value: 'khac',     label: 'Khác' },
];

const INITIAL_FORM = { title: '', type: '', description: '' };

function validate(form) {
  const errors = {};
  if (!form.title.trim())       errors.title = 'Tên tài liệu là bắt buộc.';
  else if (form.title.length > 150) errors.title = 'Tên tài liệu tối đa 150 ký tự.';
  if (!form.type)               errors.type  = 'Vui lòng chọn loại tài liệu.';
  if (form.description.length > 500) errors.description = 'Mô tả tối đa 500 ký tự.';
  return errors;
}

export default function DocumentCreatePage() {
  const navigate = useNavigate();
  const { toasts, removeToast, success: toastSuccess, error: toastError } = useToast();

  const [form,    setForm]    = useState(INITIAL_FORM);
  const [errors,  setErrors]  = useState({});
  const [saving,  setSaving]  = useState(false);

  const handleChange = (field) => (e) => {
    const val = e.target.value;
    setForm((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleBlur = (field) => () => {
    const fieldErrors = validate(form);
    if (fieldErrors[field]) setErrors((prev) => ({ ...prev, [field]: fieldErrors[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fieldErrors = validate(form);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setSaving(true);
    try {
      const doc = await documentService.create({
        title: form.title.trim(),
        type: form.type,
        description: form.description.trim(),
      });
      toastSuccess(`Tài liệu "${doc.title}" đã được tạo thành công.`);
      setTimeout(() => navigate('/tai-lieu'), 1200);
    } catch (err) {
      toastError(err.message || 'Tạo tài liệu thất bại. Vui lòng thử lại.');
      setSaving(false);
    }
  };

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Thêm tài liệu</h1>
          <p className="page-desc">Điền thông tin để tạo tài liệu mới</p>
        </div>
        <Button
          variant="ghost"
          icon={ArrowLeft}
          onClick={() => navigate('/tai-lieu')}
        >
          Quay lại
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-6)', alignItems: 'start' }}>
        {/* Form */}
        <div className="table-container" style={{ padding: 'var(--space-6)' }}>
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              {/* Mã tài liệu (readonly) */}
              <div className="form-group">
                <label className="form-label" htmlFor="code">Mã tài liệu</label>
                <input
                  id="code"
                  className="form-control"
                  value="Tự động cấp khi lưu"
                  disabled
                  readOnly
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}
                />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  Mã được hệ thống tạo tự động theo định dạng TL-XXXX
                </span>
              </div>

              {/* Tên tài liệu */}
              <Input
                id="title"
                label="Tên tài liệu"
                required
                placeholder="Nhập tên tài liệu..."
                value={form.title}
                onChange={handleChange('title')}
                onBlur={handleBlur('title')}
                error={errors.title}
                autoFocus
              />

              {/* Loại */}
              <Select
                id="type"
                label="Loại tài liệu"
                required
                value={form.type}
                onChange={handleChange('type')}
                onBlur={handleBlur('type')}
                error={errors.type}
              >
                <option value="">Chọn loại tài liệu...</option>
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>

              {/* Mô tả */}
              <div className="form-group">
                <label className="form-label" htmlFor="description">Mô tả</label>
                <textarea
                  id="description"
                  className={`form-control form-textarea${errors.description ? ' error' : ''}`}
                  placeholder="Nhập mô tả ngắn về tài liệu..."
                  value={form.description}
                  onChange={handleChange('description')}
                  onBlur={handleBlur('description')}
                  rows={4}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  {errors.description
                    ? <span className="form-error">{errors.description}</span>
                    : <span />}
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    {form.description.length}/500
                  </span>
                </div>
              </div>

              {/* Khu vực ảnh – placeholder cho Người 2 */}
              <div className="form-group">
                <label className="form-label">Ảnh tài liệu</label>
                <div style={{
                  border: '1px dashed var(--border-strong)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-8)',
                  textAlign: 'center',
                  background: 'var(--bg-muted)',
                  color: 'var(--text-muted)',
                  fontSize: 'var(--text-base)',
                }}>
                  Chức năng tải ảnh sẽ được tích hợp bởi thành viên phụ trách xử lý ảnh (Người 2)
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--border-default)' }}>
                <Button
                  variant="secondary"
                  onClick={() => navigate('/tai-lieu')}
                  disabled={saving}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  icon={Save}
                  loading={saving}
                >
                  Lưu tài liệu
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* Guide panel */}
        <div style={{
          background: 'var(--bg-muted)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}>
          <div>
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>
              Phân loại tài liệu
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {[
                ['Hóa đơn',  'Hóa đơn GTGT, chứng từ thanh toán, hóa đơn dịch vụ'],
                ['Hợp đồng', 'Hợp đồng kinh tế, lao động, thuê mướn, dịch vụ'],
                ['Giấy tờ',  'Giấy phép, chứng nhận, ủy quyền, xác nhận'],
                ['Biên bản', 'Biên bản họp, nghiệm thu, bàn giao, kiểm kê'],
                ['Khác',     'Các tài liệu không thuộc các loại trên'],
              ].map(([name, desc]) => (
                <div key={name} style={{ fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-relaxed)' }}>
                  <span style={{ fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>{name}:</span>{' '}
                  <span style={{ color: 'var(--text-secondary)' }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: 'var(--space-4)' }}>
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>
              Lưu ý
            </p>
            <ul style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <li>· Tên tài liệu tối đa 150 ký tự</li>
              <li>· Mô tả tối đa 500 ký tự</li>
              <li>· Mã tài liệu được cấp tự động</li>
              <li>· Ảnh tài liệu thêm sau khi tạo</li>
            </ul>
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
