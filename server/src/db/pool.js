import pg from 'pg';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { Pool } = pg;

export function createPool(connectionString) {
  const p = new Pool({ connectionString });

  // Self-migrating helper for DMS features (is_favorite, is_deleted, folder_name, folders table)
  p.query(`
    ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;
    ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
    ALTER TABLE documents ADD COLUMN IF NOT EXISTS folder_name VARCHAR(150) DEFAULT 'Tài liệu nội bộ';
    ALTER TABLE documents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

    CREATE TABLE IF NOT EXISTS folders (
      id SERIAL PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      description VARCHAR(500),
      owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_folders_unique_name ON folders (name, COALESCE(owner_id, 0));

    INSERT INTO folders (name, description, owner_id)
    VALUES
      ('Tài liệu nội bộ', 'Thư mục lưu trữ tài liệu nội bộ công ty', NULL),
      ('Dự án Marketing', 'Các hồ sơ chiến dịch và ấn phẩm truyền thông', NULL),
      ('Dự án IT & Công nghệ', 'Tài liệu kỹ thuật và kiến trúc hệ thống', NULL),
      ('Hợp đồng đối tác 2026', 'Hợp đồng kinh tế và thỏa thuận hợp tác', NULL),
      ('Chứng từ tài chính quý 4', 'Hóa đơn và biên lai thanh toán', NULL)
    ON CONFLICT (name, COALESCE(owner_id, 0)) DO NOTHING;

    SELECT setval(
      'document_code_seq',
      GREATEST(COALESCE((SELECT MAX(SUBSTRING(code FROM '^TL-(\d+)$')::integer) FROM documents), 0), 1),
      EXISTS (SELECT 1 FROM documents)
    );
  `).catch(() => {
    // Graceful fallback if database is not yet ready or during tests
  });

  return p;
}

const _projectRoot = fileURLToPath(new URL('../../../', import.meta.url));
dotenv.config({ path: path.join(_projectRoot, '.env') });

export const pool = createPool(process.env.DATABASE_URL);
