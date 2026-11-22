import { randomUUID } from 'node:crypto';

export function errorHandler(error, _request, response, _next) {
  const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 500
    ? error.status
    : 500;

  if (status === 500) {
    const ref = randomUUID();
    console.error({ ref, message: error.message });
    return response.status(500).json({
      ok: false,
      error: { code: 'SERVER_ERROR', message: 'Đã xảy ra lỗi hệ thống.', ref },
    });
  }

  if (status === 413) {
    return response.status(413).json({
      ok: false,
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'Dữ liệu gửi lên vượt quá giới hạn cho phép.' },
    });
  }

  return response.status(status).json({
    ok: false,
    error: {
      code: error.code || 'REQUEST_ERROR',
      message: error.message || 'Yêu cầu không hợp lệ.',
    },
  });
}
