import multer from 'multer';

function uploadError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 4, fieldSize: 8 * 1024, parts: 5 },
  fileFilter(_req, file, callback) {
    const extension = file.originalname.toLowerCase().split('.').pop();
    const allowed = (extension === 'jpg' || extension === 'jpeg') && file.mimetype === 'image/jpeg'
      || extension === 'png' && file.mimetype === 'image/png';
    if (!allowed) {
      return callback(uploadError(415, 'UNSUPPORTED_MEDIA', 'Chỉ chấp nhận ảnh JPG hoặc PNG.'));
    }
    return callback(null, true);
  },
});

export function handleUploadError(error, _req, res, next) {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      ok: false,
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'Ảnh tải lên không được vượt quá 5 MB.' },
    });
  }
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ ok: false, error: { code: 'UPLOAD_INVALID', message: 'Yêu cầu tải ảnh không hợp lệ.' } });
  }
  return next(error);
}
