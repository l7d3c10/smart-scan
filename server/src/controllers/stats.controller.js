const TYPE_LABELS = {
  hoa_don: 'Hóa đơn',
  hop_dong: 'Hợp đồng',
  giay_to: 'Giấy tờ',
  bien_ban: 'Biên bản',
  khac: 'Khác',
};

const ORDERED_TYPES = ['hoa_don', 'hop_dong', 'giay_to', 'bien_ban', 'khac'];

function ownerFilter(req) {
  return req.user?.role === 'admin' ? null : req.user?.id;
}

export async function getSummary(req, res, next) {
  const pool = req.app.locals.pool;
  const ownerId = ownerFilter(req);
  try {
    const [documents, uploads, users] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS total_documents,
                COUNT(*) FILTER (WHERE processed_path IS NOT NULL)::int AS processed_documents,
                COUNT(*) FILTER (WHERE processed_path IS NULL)::int AS unprocessed_documents
         FROM documents WHERE ($1::int IS NULL OR owner_id = $1)`,
        [ownerId]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS uploads_this_month
         FROM uploads
         WHERE ($1::int IS NULL OR owner_id = $1)
           AND created_at >= date_trunc('month', CURRENT_DATE)`,
        [ownerId]
      ),
      req.user?.role === 'admin'
        ? pool.query('SELECT COUNT(*)::int AS total_users FROM users')
        : Promise.resolve({ rows: [{ total_users: null }] }),
    ]);

    return res.status(200).json({
      ok: true,
      data: {
        totalDocuments: documents.rows[0]?.total_documents ?? 0,
        uploadsThisMonth: uploads.rows[0]?.uploads_this_month ?? 0,
        processedDocuments: documents.rows[0]?.processed_documents ?? 0,
        unprocessedDocuments: documents.rows[0]?.unprocessed_documents ?? 0,
        ...(req.user?.role === 'admin' ? { totalUsers: users.rows[0]?.total_users ?? 0 } : {}),
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getMonthlyStats(req, res, next) {
  const pool = req.app.locals.pool;
  const ownerId = ownerFilter(req);
  try {
    const result = await pool.query(
      `WITH months AS (
         SELECT generate_series(
           date_trunc('month', CURRENT_DATE) - INTERVAL '11 months',
           date_trunc('month', CURRENT_DATE),
           INTERVAL '1 month'
         ) AS month_start
       )
       SELECT to_char(m.month_start, 'YYYY-MM') AS month,
              COUNT(d.id)::int AS count
       FROM months m
       LEFT JOIN documents d
         ON date_trunc('month', d.created_at) = m.month_start
        AND ($1::int IS NULL OR d.owner_id = $1)
       GROUP BY m.month_start
       ORDER BY m.month_start`,
      [ownerId]
    );
    return res.status(200).json({ ok: true, data: { items: result.rows } });
  } catch (error) {
    return next(error);
  }
}

export async function getTypeStats(req, res, next) {
  const pool = req.app.locals.pool;
  const ownerId = ownerFilter(req);
  try {
    const result = await pool.query(
      `SELECT type, COUNT(*)::int AS count
       FROM documents
       WHERE ($1::int IS NULL OR owner_id = $1)
       GROUP BY type`,
      [ownerId]
    );

    const countMap = new Map(result.rows.map((row) => [row.type, row.count]));
    const items = ORDERED_TYPES.map((type) => ({
      type,
      label: TYPE_LABELS[type] || type,
      count: countMap.get(type) || 0,
    }));

    return res.status(200).json({ ok: true, data: { items } });
  } catch (error) {
    return next(error);
  }
}
