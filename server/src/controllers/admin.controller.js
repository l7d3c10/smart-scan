import bcrypt from 'bcryptjs';
import { writeAudit } from '../services/audit.service.js';

const PASSWORD_HASH_ROUNDS = 12;

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
    await writeAudit(client, {
      userId: req.user.id,
      username: req.user.username,
      action: locked ? 'ADMIN_LOCK' : 'ADMIN_UNLOCK',
      detail: `user_id=${id}; username=${target.username}`,
      ip: req.ip,
    });
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

export async function listUsers(req, res, next) {
  const { search = '', role = '', status = '', page = '1' } = req.query;
  const fields = {};
  if (typeof search !== 'string' || search.length > 30) fields.search = 'Từ khóa tối đa 30 ký tự.';
  if (role && !['user', 'admin'].includes(role)) fields.role = 'Vai trò không hợp lệ.';
  if (status && !['active', 'locked'].includes(status)) fields.status = 'Trạng thái không hợp lệ.';
  if (typeof page !== 'string' || !/^[1-9]\d*$/.test(page) || !Number.isSafeInteger(Number(page))) {
    fields.page = 'Trang phải là số nguyên dương.';
  }
  if (Object.keys(fields).length) {
    return res.status(422).json({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Bộ lọc không hợp lệ.', fields } });
  }

  const params = [];
  const conditions = [];
  if (search.trim()) {
    params.push(`%${search.trim()}%`);
    conditions.push(`username ILIKE $${params.length}`);
  }
  if (role) {
    params.push(role);
    conditions.push(`role = $${params.length}`);
  }
  if (status) conditions.push(status === 'locked' ? 'locked = TRUE' : 'locked = FALSE');
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = 20;
  const safePage = Number(page);
  const offset = (safePage - 1) * limit;

  try {
    const pool = req.app.locals.pool;
    const [countResult, users] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total FROM users ${where}`, params),
      pool.query(
        `SELECT id, username, role, locked, failed_attempts, locked_until, created_at
         FROM users ${where} ORDER BY created_at DESC, id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
    ]);
    const total = countResult.rows[0].total;
    return res.status(200).json({
      ok: true,
      data: { items: users.rows, total, page: safePage, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return next(error);
  }
}

export async function changeUserRole(req, res, next) {
  const id = Number(req.params.id);
  const role = req.body?.role;
  if (!Number.isInteger(id) || id < 1) {
    return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Người dùng không tồn tại.' } });
  }
  if (!['user', 'admin'].includes(role)) {
    return res.status(422).json({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Vai trò phải là user hoặc admin.', fields: { role: 'Vai trò không hợp lệ.' } } });
  }

  const pool = req.app.locals.pool;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE');
    const found = await client.query('SELECT id, username, role, locked FROM users WHERE id = $1', [id]);
    const target = found.rows[0];
    if (!target) {
      await client.query('ROLLBACK');
      return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Người dùng không tồn tại.' } });
    }
    if (target.id === req.user.id && role !== 'admin') {
      await client.query('ROLLBACK');
      return res.status(409).json({ ok: false, error: { code: 'CONFLICT', message: 'Bạn không thể tự hạ quyền Admin của mình.' } });
    }
    if (target.role === 'admin' && !target.locked && role === 'user') {
      const admins = await client.query("SELECT COUNT(*)::int AS total FROM users WHERE role = 'admin' AND locked = FALSE");
      if (admins.rows[0].total <= 1) {
        await client.query('ROLLBACK');
        return res.status(409).json({ ok: false, error: { code: 'CONFLICT', message: 'Không thể hạ quyền Admin hoạt động cuối cùng.' } });
      }
    }
    const updated = await client.query(
      'UPDATE users SET role = $2 WHERE id = $1 RETURNING id, username, role, locked, created_at',
      [id, role]
    );
    await writeAudit(client, {
      userId: req.user.id,
      username: req.user.username,
      action: 'ADMIN_ROLE_CHANGE',
      detail: `user_id=${id}; username=${target.username}; old_role=${target.role}; new_role=${role}`,
      ip: req.ip,
    });
    await client.query('COMMIT');
    return res.status(200).json({ ok: true, data: { user: updated.rows[0] } });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    return next(error);
  } finally {
    client.release();
  }
}

export async function resetUserPassword(req, res, next) {
  const id = Number(req.params.id);
  const password = req.body?.password;
  if (!Number.isInteger(id) || id < 1) {
    return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Người dùng không tồn tại.' } });
  }
  if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return res.status(422).json({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Mật khẩu cần ít nhất 8 ký tự, tối đa 72 byte, gồm chữ và số.', fields: { password: 'Mật khẩu không đáp ứng yêu cầu.' } } });
  }

  const passwordHash = await bcrypt.hash(password, PASSWORD_HASH_ROUNDS);
  const pool = req.app.locals.pool;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const updated = await client.query(
      `UPDATE users
       SET password_hash = $2, failed_attempts = 0, locked_until = NULL
       WHERE id = $1
       RETURNING id, username`,
      [id, passwordHash]
    );
    const target = updated.rows[0];
    if (!target) {
      await client.query('ROLLBACK');
      return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Người dùng không tồn tại.' } });
    }
    await client.query("DELETE FROM session WHERE sess->>'userId' = $1", [String(id)]);
    await writeAudit(client, {
      userId: req.user.id,
      username: req.user.username,
      action: 'ADMIN_RESET_PASSWORD',
      detail: `user_id=${id}; username=${target.username}`,
      ip: req.ip,
    });
    await client.query('COMMIT');
    return res.status(200).json({ ok: true, data: { user: target, sessionsRevoked: true } });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    return next(error);
  } finally {
    client.release();
  }
}
