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

  return response.status(status).json({
    ok: false,
    error: {
      code: error.code || 'REQUEST_ERROR',
      message: error.message || 'Yêu cầu không hợp lệ.',
    },
  });
}
