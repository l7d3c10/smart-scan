async function setUserLock(req, res, next, locked) {
  const pool = req.app.locals.pool;
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Người dùng không tồn tại.' } });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Serialize role-lock changes so two requests cannot lock the final active Admin concurrently.
    await client.query('LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE');
    const existing = await client.query('SELECT id, username, role FROM users WHERE id = $1', [id]);
    const target = existing.rows[0];
    if (!target) {
      await client.query('ROLLBACK');
      return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Người dùng không tồn tại.' } });
    }
    if (locked && target.id === req.user.id) {
      await client.query('ROLLBACK');
      return res.status(409).json({ ok: false, error: { code: 'CONFLICT', message: 'Bạn không thể tự khóa tài khoản của mình.' } });
    }
    if (locked && target.role === 'admin') {
      const admins = await client.query("SELECT COUNT(*)::int AS total FROM users WHERE role = 'admin' AND locked = FALSE");
      if (admins.rows[0].total <= 1) {
        await client.query('ROLLBACK');
        return res.status(409).json({ ok: false, error: { code: 'CONFLICT', message: 'Không thể khóa Admin đang hoạt động cuối cùng.' } });
      }
    }

    const result = await client.query(
      `UPDATE users
       SET locked = $2, failed_attempts = 0, locked_until = NULL
       WHERE id = $1
       RETURNING id, username, role, locked`,
      [id, locked]
    );
    await client.query(
      `INSERT INTO audit_logs (user_id, actor_username, action, detail, ip)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, req.user.username, locked ? 'ADMIN_LOCK' : 'ADMIN_UNLOCK', `user_id=${id}; username=${target.username}`, req.ip || null]
    );
    await client.query('COMMIT');
    return res.status(200).json({ ok: true, data: { user: result.rows[0] } });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    return next(error);
  } finally {
    client.release();
  }
}

export function lockUser(req, res, next) {
  return setUserLock(req, res, next, true);
}

export function unlockUser(req, res, next) {
  return setUserLock(req, res, next, false);
}
