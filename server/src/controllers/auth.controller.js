import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { issueCsrfToken } from '../middleware/csrf.js';
import { writeAudit } from '../services/audit.service.js';

const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,30}$/;
const BCRYPT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const TEMP_LOCK_MINUTES = 15;
// Hash giả để phản hồi đăng nhập không tiết lộ username có tồn tại hay không.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('SmartScan timing guard', BCRYPT_ROUNDS);

function publicUser(row) {
  return { id: row.id, username: row.username, role: row.role };
}

function validPassword(password) {
  return typeof password === 'string'
    && password.length >= 8
    && Buffer.byteLength(password, 'utf8') <= 72
    && /[A-Za-z]/.test(password)
    && /\d/.test(password);
}

function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => (error ? reject(error) : resolve()));
  });
}

function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((error) => (error ? reject(error) : resolve()));
  });
}

export function getCsrfToken(req, res) {
  return issueCsrfToken(req, res);
}

export async function register(req, res, next) {
  const pool = req.app.locals.pool;
  const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
  const password = req.body?.password;
  const fields = {};

  if (!USERNAME_PATTERN.test(username)) {
    fields.username = 'Tên đăng nhập phải có 3–30 ký tự gồm chữ, số hoặc dấu gạch dưới.';
  }
  if (!validPassword(password)) {
    fields.password = 'Mật khẩu cần ít nhất 8 ký tự, tối đa 72 byte, gồm chữ và số.';
  }
  if (Object.keys(fields).length) {
    return res.status(422).json({
      ok: false,
      error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu đăng ký không hợp lệ.', fields },
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const result = await pool.query(
      `INSERT INTO users (username, password_hash, role)
       VALUES ($1, $2, 'user')
       ON CONFLICT (LOWER(username)) DO NOTHING
       RETURNING id, username, role`,
      [username, passwordHash]
    );
    if (!result.rows.length) {
      return res.status(409).json({
        ok: false,
        error: { code: 'CONFLICT', message: 'Tên đăng nhập đã được sử dụng.' },
      });
    }
    const user = result.rows[0];
    await writeAudit(pool, {
      userId: user.id,
      username: user.username,
      action: 'REGISTER',
      ip: req.ip,
    });
    return res.status(201).json({ ok: true, data: { user: publicUser(user) } });
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  const pool = req.app.locals.pool;
  const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  try {
    const result = await pool.query(
      `SELECT id, username, password_hash, role, locked, failed_attempts, locked_until
       FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1`,
      [username]
    );
    const row = result.rows[0];
    const matches = await bcrypt.compare(password, row?.password_hash || DUMMY_PASSWORD_HASH);
    if (row?.locked_until && new Date(row.locked_until) <= new Date()) {
      await pool.query(
        'UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = $1',
        [row.id]
      );
      row.failed_attempts = 0;
      row.locked_until = null;
    }
    if (row?.locked) {
      await writeAudit(pool, {
        userId: row.id,
        username: row.username,
        action: 'LOGIN_FAIL',
        ip: req.ip,
      });
      return res.status(401).json({
        ok: false,
        error: { code: 'UNAUTHENTICATED', message: 'Tên đăng nhập hoặc mật khẩu không đúng.' },
      });
    }

    if (row?.locked_until && new Date(row.locked_until) > new Date()) {
      const retryAfterSeconds = Math.ceil((new Date(row.locked_until).getTime() - Date.now()) / 1000);
      await writeAudit(pool, {
        userId: row.id,
        username: row.username,
        action: 'LOGIN_FAIL',
        ip: req.ip,
      });
      return res.status(423).json({
        ok: false,
        error: {
          code: 'ACCOUNT_TEMPORARILY_LOCKED',
          message: 'Tài khoản tạm khóa do đăng nhập sai nhiều lần.',
          retryAfterSeconds,
        },
      });
    }

    if (!row || !matches) {
      if (row) {
        const failed = await pool.query(
          `UPDATE users
           SET failed_attempts = failed_attempts + 1,
               locked_until = CASE
                 WHEN failed_attempts + 1 >= $2 THEN NOW() + ($3 * INTERVAL '1 minute')
                 ELSE NULL
               END
           WHERE id = $1
           RETURNING failed_attempts, locked_until`,
          [row.id, MAX_FAILED_ATTEMPTS, TEMP_LOCK_MINUTES]
        );
        row.failed_attempts = failed.rows[0].failed_attempts;
        row.locked_until = failed.rows[0].locked_until;
      }
      await writeAudit(pool, {
        userId: row?.id ?? null,
        username: row?.username ?? (username.slice(0, 30) || 'unknown'),
        action: 'LOGIN_FAIL',
        ip: req.ip,
      });
      if (row?.locked_until) {
        return res.status(423).json({
          ok: false,
          error: {
            code: 'ACCOUNT_TEMPORARILY_LOCKED',
            message: 'Tài khoản tạm khóa do đăng nhập sai nhiều lần.',
            retryAfterSeconds: TEMP_LOCK_MINUTES * 60,
          },
        });
      }
      return res.status(401).json({
        ok: false,
        error: { code: 'UNAUTHENTICATED', message: 'Tên đăng nhập hoặc mật khẩu không đúng.' },
      });
    }

    await pool.query(
      'UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = $1',
      [row.id]
    );

    await regenerateSession(req);
    req.session.userId = row.id;
    req.session.username = row.username;
    req.session.role = row.role;
    req.session.csrfToken = randomBytes(32).toString('hex');
    await saveSession(req);
    await writeAudit(pool, {
      userId: row.id,
      username: row.username,
      action: 'LOGIN_SUCCESS',
      ip: req.ip,
    });
    return res.status(200).json({
      ok: true,
      data: { user: publicUser(row), csrfToken: req.session.csrfToken },
    });
  } catch (error) {
    return next(error);
  }
}

export async function logout(req, res, next) {
  const pool = req.app.locals.pool;
  const userId = req.session?.userId;
  const username = req.session?.username || 'unknown';
  try {
    if (userId) await writeAudit(pool, { userId, username, action: 'LOGOUT', ip: req.ip });
    req.session.destroy((error) => {
      if (error) return next(error);
      res.clearCookie('smartscan.sid', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
      return res.status(200).json({ ok: true, data: { loggedOut: true } });
    });
  } catch (error) {
    return next(error);
  }
}

export async function getCurrentUser(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({
      ok: false,
      error: { code: 'UNAUTHENTICATED', message: 'Bạn chưa đăng nhập.' },
    });
  }
  try {
    const result = await req.app.locals.pool.query(
      'SELECT id, username, role, locked FROM users WHERE id = $1',
      [req.session.userId]
    );
    const row = result.rows[0];
    if (!row || row.locked) {
      return res.status(401).json({
        ok: false,
        error: { code: 'UNAUTHENTICATED', message: 'Phiên đăng nhập không còn hợp lệ.' },
      });
    }
    return res.status(200).json({ ok: true, data: { user: publicUser(row) } });
  } catch (error) {
    return next(error);
  }
}

export async function changePassword(req, res, next) {
  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  const currentPassword = body.currentPassword;
  const newPassword = body.newPassword;
  const confirmPassword = body.confirmPassword;
  if (typeof currentPassword !== 'string' || !currentPassword) {
    return res.status(422).json({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Vui lòng nhập mật khẩu hiện tại.', fields: { currentPassword: 'Bắt buộc.' } } });
  }
  if (!validPassword(newPassword)) {
    return res.status(422).json({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Mật khẩu mới cần ít nhất 8 ký tự, tối đa 72 byte, gồm chữ và số.', fields: { newPassword: 'Mật khẩu không đáp ứng yêu cầu.' } } });
  }
  if (newPassword !== confirmPassword) {
    return res.status(422).json({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Mật khẩu nhập lại chưa khớp.', fields: { confirmPassword: 'Mật khẩu không khớp.' } } });
  }

  const pool = req.app.locals.pool;
  let passwordHash;
  try {
    const found = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const currentHash = found.rows[0]?.password_hash;
    if (!currentHash || !(await bcrypt.compare(currentPassword, currentHash))) {
      return res.status(401).json({ ok: false, error: { code: 'INVALID_CREDENTIALS', message: 'Mật khẩu hiện tại không đúng.' } });
    }
    if (await bcrypt.compare(newPassword, currentHash)) {
      return res.status(422).json({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Mật khẩu mới phải khác mật khẩu hiện tại.' } });
    }
    passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  } catch (error) {
    return next(error);
  }

  const currentSessionId = req.sessionID;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE users SET password_hash = $2, failed_attempts = 0, locked_until = NULL WHERE id = $1', [req.user.id, passwordHash]);
    await client.query("DELETE FROM session WHERE sess->>'userId' = $1 AND sid <> $2", [String(req.user.id), currentSessionId]);
    await writeAudit(client, {
      userId: req.user.id, username: req.user.username,
      action: 'PASSWORD_CHANGE', detail: 'Đổi mật khẩu thành công.', ip: req.ip,
    });
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    return next(error);
  } finally {
    client.release();
  }

  try {
    await regenerateSession(req);
    req.session.userId = req.user.id;
    req.session.username = req.user.username;
    req.session.role = req.user.role;
    req.session.csrfToken = randomBytes(32).toString('hex');
    await saveSession(req);
    return res.status(200).json({
      ok: true,
      data: { user: publicUser(req.user), csrfToken: req.session.csrfToken },
    });
  } catch (error) {
    return next(error);
  }
}
