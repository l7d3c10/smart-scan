function ownerFilter(req) {
  return req.user.role === 'admin' ? null : req.user.id;
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
           AND created_at >= (
             date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')
             AT TIME ZONE 'Asia/Ho_Chi_Minh'
           )`,
        [ownerId]
      ),
      req.user.role === 'admin'
        ? pool.query('SELECT COUNT(*)::int AS total_users FROM users')
        : Promise.resolve({ rows: [{ total_users: null }] }),
    ]);

    return res.status(200).json({
      ok: true,
      data: {
        totalDocuments: documents.rows[0].total_documents,
        uploadsThisMonth: uploads.rows[0].uploads_this_month,
        processedDocuments: documents.rows[0].processed_documents,
        unprocessedDocuments: documents.rows[0].unprocessed_documents,
        ...(req.user.role === 'admin' ? { totalUsers: users.rows[0].total_users } : {}),
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
           date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh') - INTERVAL '11 months',
           date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh'),
           INTERVAL '1 month'
         ) AS month_start
       )
       SELECT to_char(m.month_start, 'YYYY-MM') AS month,
              COUNT(d.id)::int AS count
       FROM months m
       LEFT JOIN documents d
         ON date_trunc('month', d.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') = m.month_start
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
      `SELECT types.code AS type, types.label,
              COUNT(d.id)::int AS count
       FROM (VALUES
         ('hoa_don', 'Hóa đơn'),
         ('hop_dong', 'Hợp đồng'),
         ('giay_to', 'Giấy tờ'),
         ('bien_ban', 'Biên bản'),
         ('khac', 'Khác')
       ) AS types(code, label)
       LEFT JOIN documents d
         ON d.type = types.code
        AND ($1::int IS NULL OR d.owner_id = $1)
       GROUP BY types.code, types.label
       ORDER BY array_position(ARRAY['hoa_don','hop_dong','giay_to','bien_ban','khac'], types.code)`,
      [ownerId]
    );
    return res.status(200).json({ ok: true, data: { items: result.rows } });
  } catch (error) {
    return next(error);
  }
}

