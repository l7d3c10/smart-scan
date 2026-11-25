-- Migration 003: DocManager DMS Advanced Features
-- Adds support for Folders, Recycle Bin (soft delete), Favorites, and Versioning

ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS folder_name VARCHAR(100) DEFAULT 'Tài liệu nội bộ';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Indices for fast filtering
CREATE INDEX IF NOT EXISTS documents_favorite_idx ON documents (owner_id, is_favorite);
CREATE INDEX IF NOT EXISTS documents_deleted_idx ON documents (owner_id, is_deleted);
CREATE INDEX IF NOT EXISTS documents_folder_idx ON documents (owner_id, folder_name);
