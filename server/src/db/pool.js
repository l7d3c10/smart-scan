import pg from 'pg';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { Pool } = pg;

export function createPool(connectionString) {
  const p = new Pool({ connectionString });

  // Self-migrating helper for DMS features (is_favorite, is_deleted, folder_name)
  p.query(`
    ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;
    ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
    ALTER TABLE documents ADD COLUMN IF NOT EXISTS folder_name VARCHAR(100) DEFAULT 'Tài liệu nội bộ';
    ALTER TABLE documents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
  `).catch(() => {
    // Graceful fallback if database is not yet ready or during tests
  });

  return p;
}

const _projectRoot = fileURLToPath(new URL('../../../', import.meta.url));
dotenv.config({ path: path.join(_projectRoot, '.env') });

export const pool = createPool(process.env.DATABASE_URL);
