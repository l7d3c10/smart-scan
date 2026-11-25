-- Migration 004: Dedicated Folders Table for Document Management (DocManager)
-- Creates folders table, indexes, and standard default folders

CREATE TABLE IF NOT EXISTS folders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(500),
    owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_folders_unique_name ON folders (name, COALESCE(owner_id, 0));
CREATE INDEX IF NOT EXISTS idx_folders_owner ON folders(owner_id);
CREATE INDEX IF NOT EXISTS idx_folders_name ON folders(name);

-- Seed standard system folders if table is empty
INSERT INTO folders (name, description, owner_id)
VALUES
    ('Tài liệu nội bộ', 'Thư mục lưu trữ tài liệu nội bộ công ty', NULL),
    ('Dự án Marketing', 'Các hồ sơ chiến dịch và ấn phẩm truyền thông', NULL),
    ('Dự án IT & Công nghệ', 'Tài liệu kỹ thuật và kiến trúc hệ thống', NULL),
    ('Hợp đồng đối tác 2026', 'Hợp đồng kinh tế và thỏa thuận hợp tác', NULL),
    ('Chứng từ tài chính quý 4', 'Hóa đơn và biên lai thanh toán', NULL)
ON CONFLICT (name, COALESCE(owner_id, 0)) DO NOTHING;
