import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { documentService } from '../services/document.service.js';
import { useToast } from '../hooks/useToast.js';
import { Button } from '../components/ui/Button.jsx';
import { ToastContainer } from '../components/ui/ToastContainer.jsx';
import { DocumentForm } from '../components/documents/DocumentForm.jsx';

export default function DocumentCreatePage() {
  const navigate = useNavigate();
  const { toasts, removeToast, success: toastSuccess, error: toastError } = useToast();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (form) => {
    setSaving(true);
    try {
      const doc = await documentService.create({
        title: form.title.trim(),
        type: form.type,
        description: form.description.trim(),
      });
      toastSuccess(`Tài liệu "${doc.title}" đã được tạo thành công.`);
      setTimeout(() => navigate('/tai-lieu'), 1000);
    } catch (err) {
      toastError(err.message || 'Tạo tài liệu thất bại. Vui lòng thử lại.');
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Thêm tài liệu mới</h1>
          <p className="page-desc">Nhập thông tin ban đầu để số hóa và lưu trữ tài liệu</p>
        </div>
        <Button
          variant="ghost"
          icon={ArrowLeft}
          onClick={() => navigate('/tai-lieu')}
        >
          Quay lại danh sách
        </Button>
      </div>

      <DocumentForm
        mode="create"
        onSubmit={handleSubmit}
        saving={saving}
      />

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
