import { randomBytes, timingSafeEqual } from 'node:crypto';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function csrfProtection(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  if (!req.session) {
    return res.status(500).json({
      ok: false,
      error: { code: 'SERVER_ERROR', message: 'Không thể khởi tạo phiên bảo mật.' },
    });
  }

  const supplied = req.get('X-CSRF-Token') || '';
  const expected = req.session.csrfToken || '';
  const valid = supplied.length === expected.length
    && expected.length > 0
    && timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));

  if (!valid) {
    return res.status(403).json({
      ok: false,
      error: { code: 'CSRF_INVALID', message: 'Phiên bảo mật không hợp lệ. Vui lòng thử lại.' },
    });
  }
  return next();
}

export function issueCsrfToken(req, res) {
  if (!req.session.csrfToken) req.session.csrfToken = randomBytes(32).toString('hex');
  return res.status(200).json({ ok: true, data: { csrfToken: req.session.csrfToken } });
}
