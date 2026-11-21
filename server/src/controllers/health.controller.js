export function healthController(_request, response) {
  return response.status(200).json({ ok: true, data: { status: 'ok' } });
}

export async function healthDbController(request, response) {
  const pool = request.app.locals.pool;
  if (!pool) {
    return response.status(503).json({
      ok: false,
      error: { code: 'DB_UNAVAILABLE', message: 'Pool chưa được khởi tạo.' },
    });
  }
  const start = Date.now();
  try {
    await pool.query('SELECT 1');
    const latency_ms = Date.now() - start;
    return response.status(200).json({ ok: true, data: { status: 'ok', latency_ms } });
  } catch (err) {
    return response.status(503).json({
      ok: false,
      error: { code: 'DB_UNAVAILABLE', message: 'Không thể kết nối cơ sở dữ liệu.' },
    });
  }
}
