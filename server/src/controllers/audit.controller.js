const ACTIONS = [
  'LOGIN_SUCCESS', 'LOGIN_FAIL', 'LOGOUT', 'REGISTER', 'PASSWORD_CHANGE',
  'PROCESS_IMAGE', 'DOC_CREATE', 'DOC_UPDATE', 'DOC_DELETE', 'DOC_COPY',
  'DOC_IMPORT', 'DOC_EXPORT', 'ADMIN_ROLE_CHANGE', 'ADMIN_LOCK',
  'ADMIN_UNLOCK', 'ADMIN_RESET_PASSWORD',
];

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function listAuditLogs(req, res, next) {
  const { search = '', action = '', from = '', to = '', page = '1', export: exportFormat = '' } = req.query;
  const fields = {};
  if (typeof search !== 'string' || search.length > 100) fields.search = 'Từ khóa tối đa 100 ký tự.';
  if (action && !ACTIONS.includes(action)) fields.action = 'Loại hoạt động không hợp lệ.';
  if (from && !validDate(from)) fields.from = 'Ngày bắt đầu không hợp lệ.';
  if (to && !validDate(to)) fields.to = 'Ngày kết thúc không hợp lệ.';
  if (from && to && validDate(from) && validDate(to) && from > to) fields.to = 'Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.';
  if (exportFormat && exportFormat !== 'json') fields.export = 'Định dạng xuất chỉ hỗ trợ json.';
  if (exportFormat !== 'json' && (typeof page !== 'string' || !/^[1-9]\d*$/.test(page) || !Number.isSafeInteger(Number(page)) || Number(page) > 1000000)) {
    fields.page = 'Trang phải là số nguyên dương.';
  }
  if (Object.keys(fields).length) {
    return res.status(422).json({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Bộ lọc nhật ký không hợp lệ.', fields } });
  }

  const params = [];
  const conditions = [];
  if (search.trim()) {
    params.push(`%${search.trim()}%`);
    conditions.push(`(logs.actor_username ILIKE $${params.length} OR COALESCE(logs.detail, '') ILIKE $${params.length})`);
  }
  if (action) {
    params.push(action);
    conditions.push(`logs.action = $${params.length}`);
  }
  if (from) {
    params.push(from);
    conditions.push(`logs.created_at >= $${params.length}::date`);
  }
  if (to) {
    params.push(to);
    conditions.push(`logs.created_at < ($${params.length}::date + INTERVAL '1 day')`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const pool = req.app.locals.pool;
    const countResult = await pool.query(`SELECT COUNT(*)::int AS total FROM audit_logs AS logs ${where}`, params);
    const total = countResult.rows[0].total;
    const limit = exportFormat === 'json' ? 10000 : 20;
    const pageNumber = exportFormat === 'json' ? 1 : Number(page);
    const offset = exportFormat === 'json' ? 0 : (pageNumber - 1) * limit;
    const values = [...params, limit, offset];
    const result = await pool.query(
      `SELECT logs.id, logs.user_id, logs.actor_username, logs.action,
              logs.document_id, logs.detail, logs.ip, logs.created_at,
              documents.code AS document_code, documents.title AS document_title
       FROM audit_logs AS logs
       LEFT JOIN documents ON documents.id = logs.document_id
       ${where}
       ORDER BY logs.created_at DESC, logs.id DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );
    if (exportFormat === 'json') {
      return res.status(200).json({ ok: true, data: { items: result.rows, total, truncated: total > limit } });
    }
    return res.status(200).json({
      ok: true,
      data: { items: result.rows, total, page: pageNumber, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return next(error);
  }
}
