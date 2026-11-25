import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Upload, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { Input } from '../ui/Input.jsx';
import { Select } from '../ui/Select.jsx';
import { documentService } from '../../services/document.service.js';

const TYPE_OPTIONS = [
  { value: 'hoa_don',  label: 'Hóa đơn' },
  { value: 'hop_dong', label: 'Hợp đồng' },
  { value: 'giay_to',  label: 'Giấy tờ' },
  { value: 'bien_ban', label: 'Biên bản' },
  { value: 'khac',     label: 'Khác' },
];

export function DocumentForm({ mode = 'create', initialData = null, onSubmit, saving }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    code: initialData?.code || 'Đang lấy mã...',
    title: initialData?.title || '',
    type: initialData?.type || '',
    description: initialData?.description || '',
  });

  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  // Fetch next code if in create mode
  useEffect(() => {
    if (mode === 'create') {
      documentService.nextCode()
        .then((res) => {
          const nextCode = res?.nextCode || res?.data?.nextCode;
          if (nextCode) {
            setForm((prev) => ({ ...prev, code: nextCode }));
          }
        })
        .catch(() => {
          setForm((prev) => ({ ...prev, code: 'TL-Tự sinh' }));
        });
    } else if (initialData) {
      setForm({
        code: initialData.code || '',
        title: initialData.title || '',
        type: initialData.type || '',
        description: initialData.description || '',
      });
    }
  }, [mode, initialData]);

  // Warn on leaving if unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleChange = (field) => (e) => {
    const val = e.target.value;
    setForm((prev) => ({ ...prev, [field]: val }));
    setIsDirty(true);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) {
      errs.title = 'Tên tài liệu là bắt buộc.';
    } else if (form.title.trim().length > 150) {
      errs.title = 'Tên tài liệu tối đa 150 ký tự.';
    }

    if (!form.type) {
      errs.type = 'Vui lòng chọn loại tài liệu.';
    }

    if (form.description.length > 500) {
      errs.description = 'Mô tả tối đa 500 ký tự.';
    }
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setIsDirty(false);
    onSubmit(form);
  };

  const handleCancel = () => {
    if (isDirty && !window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc muốn rời đi?')) {
      return;
    }
    navigate('/tai-lieu');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-6)', alignItems: 'start' }}>
      {/* Form area */}
      <div className="table-container" style={{ padding: 'var(--space-6)' }}>
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

            {/* Mã tài liệu (readonly) */}
            <div className="form-group">
              <label className="form-label" htmlFor="code">
                Mã tài liệu {mode === 'create' ? '(Dự kiến cấp)' : '(Cố định)'}
              </label>
              <input
                id="code"
                className="form-control"
                value={form.code}
                disabled
                readOnly
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-primary-700)',
                  fontWeight: 'var(--weight-semibold)',
                  background: 'var(--bg-muted)'
                }}
              />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                {mode === 'create'
                  ? 'Mã chính thức sẽ được server sinh tự động từ SEQUENCE'
                  : 'Mã định danh duy nhất không thể chỉnh sửa'}
              </span>
            </div>

            {/* Tên tài liệu + Counter 150 */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="title">
                  Tên tài liệu <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <span style={{
                  fontSize: 'var(--text-xs)',
                  color: form.title.length > 150 ? 'var(--color-danger)' : 'var(--text-muted)'
                }}>
                  {form.title.length}/150
                </span>
              </div>
              <input
                id="title"
                className={`form-control${errors.title ? ' error' : ''}`}
                placeholder="Nhập tên tài liệu rõ ràng, dễ tra cứu..."
                value={form.title}
                onChange={handleChange('title')}
                maxLength={150}
                autoFocus
              />
              {errors.title && <span className="form-error">{errors.title}</span>}
            </div>

            {/* Loại tài liệu */}
            <Select
              id="type"
              label="Loại tài liệu"
              required
              value={form.type}
              onChange={handleChange('type')}
              error={errors.type}
            >
              <option value="">-- Chọn loại tài liệu --</option>
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>

            {/* Mô tả + Counter 500 */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="description">
                  Mô tả chi tiết
                </label>
                <span style={{
                  fontSize: 'var(--text-xs)',
                  color: form.description.length > 500 ? 'var(--color-danger)' : 'var(--text-muted)'
                }}>
                  {form.description.length}/500
                </span>
              </div>
              <textarea
                id="description"
                className={`form-control form-textarea${errors.description ? ' error' : ''}`}
                placeholder="Mô tả bổ sung về nội dung, số hợp đồng, ngày ký kết, bên liên quan..."
                value={form.description}
                onChange={handleChange('description')}
                rows={4}
                maxLength={500}
              />
              {errors.description && <span className="form-error">{errors.description}</span>}
            </div>

            {/* Action buttons bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 'var(--space-4)',
              borderTop: '1px solid var(--border-default)',
              marginTop: 'var(--space-2)'
            }}>
              <Button variant="ghost" type="button" onClick={handleCancel}>
                Hủy bỏ
              </Button>

              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <Button
                  variant="primary"
                  type="submit"
                  icon={Save}
                  loading={saving}
                >
                  {mode === 'create' ? 'Lưu tài liệu' : 'Lưu thay đổi'}
                </Button>
              </div>
            </div>

          </div>
        </form>
      </div>

      {/* Side guidance panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div className="table-container" style={{ padding: 'var(--space-5)' }}>
          <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-2)' }}>
            💡 Hướng dẫn nhập liệu
          </h4>
          <ul style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 'var(--leading-relaxed)',
            paddingLeft: 20,
            margin: 0
          }}>
            <li>Mã tài liệu định dạng <code>TL-XXXX</code> được hệ thống tự cấp liên tục.</li>
            <li>Đặt tên tài liệu rõ ràng, chứa từ khóa chính để tìm kiếm nhanh.</li>
            <li>Phân loại chính xác giúp tạo báo cáo thống kê trực quan.</li>
            <li>Sau khi lưu, bạn có thể tải ảnh lên để chạy xử lý ảnh OpenCV.</li>
          </ul>
        </div>

        {mode === 'edit' && initialData && (
          <div className="table-container" style={{ padding: 'var(--space-5)' }}>
            <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-2)' }}>
              Ảnh tài liệu
            </h4>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
              {initialData.processed_path ? '✓ Tài liệu đã có ảnh xử lý' : 'Tài liệu chưa có ảnh xử lý'}
            </p>
            <Button
              variant="secondary"
              size="sm"
              icon={Upload}
              onClick={() => navigate(`/tai-len?documentId=${initialData.id}`)}
              style={{ width: '100%' }}
            >
              Đổi / Tải ảnh mới
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
