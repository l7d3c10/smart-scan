import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import pg from 'pg';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = fileURLToPath(new URL('../../../', import.meta.url));
dotenv.config({ path: path.join(projectRoot, '.env') });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const rounds = 12;

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Thiếu biến môi trường ${name}.`);
  return value;
}

async function ensureUser(username, password, role) {
  if (!/^[A-Za-z0-9_]{3,30}$/.test(username)) {
    throw new Error(`Tên tài khoản mẫu ${username} không hợp lệ.`);
  }
  if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new Error(`Mật khẩu ${role} cần ít nhất 8 ký tự, tối đa 72 byte, gồm chữ và số.`);
  }

  const passwordHash = await bcrypt.hash(password, rounds);
  const result = await pool.query(
    `INSERT INTO users (username, password_hash, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (LOWER(username)) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       role = EXCLUDED.role,
       locked = FALSE,
       failed_attempts = 0,
       locked_until = NULL
     RETURNING (xmax = 0) AS inserted`,
    [username, passwordHash, role]
  );
  console.log(`${result.rows[0].inserted ? 'Đã tạo' : 'Đã cập nhật'} tài khoản ${role}: ${username}`);
}

try {
  if (!process.env.DATABASE_URL) throw new Error('Thiếu biến môi trường DATABASE_URL.');
  const adminUsername = required('SEED_ADMIN_USERNAME');
  const adminPassword = required('SEED_ADMIN_PASSWORD');
  const userUsername = required('SEED_USER_USERNAME');
  const userPassword = required('SEED_USER_PASSWORD');
  if (adminUsername.toLowerCase() === userUsername.toLowerCase()) {
    throw new Error('Tài khoản Admin và User mẫu phải khác nhau.');
  }

  await ensureUser(adminUsername, adminPassword, 'admin');
  await ensureUser(userUsername, userPassword, 'user');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
