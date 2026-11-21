import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { useDocument } from '../hooks/useDocument.js';
import { documentService } from '../services/document.service.js';
import { useToast } from '../hooks/useToast.js';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Select } from '../components/ui/Select.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { ToastContainer } from '../components/ui/ToastContainer.jsx';

const TYPE_OPTIONS = [
  { value: 'hoa_don',  label: 'Hóa đơn' },
  { value: 'hop_dong', label: 'Hợp đồng' },
  { value: 'giay_to',  label: 'Giấy tờ' },
  { value: 'bien_ban', label: 'Biên bản' },
  { value: 'khac',     label: 'Khác' },
];

function validate(form) {
  const errors = {};
  if (!form.title.trim())            errors.title = 'Tên tài liệu là bắt buộc.';
  else if (form.title.length > 150)  errors.title = 'Tên tài liệu tối đa 150 ký tự.';
  if (!form.type)                    errors.type  = 'Vui lòng chọn loại tài liệu.';
  if (form.description.length > 500) errors.description = 'Mô tả tối đa 500 ký tự.';
  return errors;
}

export default function DocumentEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: doc, loading, error } = useDocument(id);
  const { toasts, removeToast, success: toastSuccess, error: toastError } = useToast();

  const [form,   setForm]   = useState({ title: '', type: '', description: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Pre-fill form once doc loads
  useEffect(() => {
    if (doc && !initialized) {
      setForm({ title: doc.title, type: doc.type, description: doc.description || '' });
      setInitialized(true);
    }
  }, [doc, initialized]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleBlur = (field) => () => {
    const fieldErrors = validate(form);
    if (fieldErrors[field]) setErrors((prev) => ({ ...prev, [field]: fieldErrors[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fieldErrors = validate(form);
    if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); return; }

    setSaving(true);
    try {
      await documentService.update(id, {
        title: form.title.trim(),
        type: form.type,
        description: form.description.trim(),
      });
      toastSuccess('Đã cập nhật tài liệu thành công.');
      setTimeout(() => navigate(`/tai-lieu/${id}`), 1200);
    } catch (err) {
      toastError(err.message || 'Cập nhật thất bại. Vui lòng thử lại.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        {[200, 300, 150, 100].map((w, i) => <Skeleton key={i} width={w} />)}
      </div>
    );
  }

  if (error || !doc) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Không tìm thấy tài liệu"
        description="Tài liệu không tồn tại hoặc đã bị xóa."
        action={
          <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/tai-lieu')}>
            Quay lại danh sách
          </Button>
        }
      />
    );
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Chỉnh sửa tài liệu</h1>
          <p className="page-desc">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{doc.code}</span>
            {' · '}{doc.title}
          </p>
        </div>
        <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate(`/tai-lieu/${id}`)}>
          Quay lại
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-6)', alignItems: 'start' }}>
        <div className="table-container" style={{ padding: 'var(--space-6)' }}>
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              {/* Mã – readonly */}
              <div className="form-group">
                <label className="form-label" htmlFor="code">Mã tài liệu</label>
                <input
                  id="code"
                  className="form-control"
                  value={doc.code}
                  disabled
                  readOnly
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}
                />
              </div>

              <Input
                id="title"
                label="Tên tài liệu"
                required
                value={form.title}
                onChange={handleChange('title')}
                onBlur={handleBlur('title')}
                error={errors.title}
                autoFocus
              />

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

              <div className="form-group">
                <label className="form-label" htmlFor="description">Mô tả</label>
                <textarea
                  id="description"
                  className={`form-control form-textarea${errors.description ? ' error' : ''}`}
                  value={form.description}
                  onChange={handleChange('description')}
                  onBlur={handleBlur('description')}
                  rows={4}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  {errors.description ? <span className="form-error">{errors.description}</span> : <span />}
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{form.description.length}/500</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--border-default)' }}>
                <Button variant="secondary" onClick={() => navigate(`/tai-lieu/${id}`)} disabled={saving}>
                  Hủy
                </Button>
                <Button type="submit" variant="primary" icon={Save} loading={saving}>
                  Lưu thay đổi
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* Metadata panel */}
        <div style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
          <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-3)', color: 'var(--text-primary)' }}>
            Thông tin hiện tại
          </p>
          {[
            ['Mã', doc.code],
            ['Loại', doc.type_label],
            ['Ngày tạo', new Date(doc.created_at).toLocaleDateString('vi-VN')],
            ['Cập nhật', new Date(doc.updated_at).toLocaleDateString('vi-VN')],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-default)' }}>
              <span style={{ width: 90, flexShrink: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{k}</span>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontFamily: k === 'Mã' ? 'var(--font-mono)' : 'inherit' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
