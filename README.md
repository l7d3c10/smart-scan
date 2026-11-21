# SmartScan

Web app đồ án số hóa và quản lý tài liệu. Giao diện dùng React/Vite, API dùng Express/PostgreSQL, xử lý ảnh dùng Python/OpenCV.

## Yêu cầu

- Node.js `20.19+` và npm.
- Python 3.14 (để dùng wheel OpenCV 4.x có sẵn).
- PostgreSQL 15+.

## PostgreSQL: tạo database và bảng

Kế hoạch gốc không bắt buộc tên database. Script dưới đây dùng tên `smartscan`.

### 1. Tạo database

Trong pgAdmin, mở Query Tool của database `postgres` và chạy lệnh này một lần:

```sql
CREATE DATABASE smartscan;
```

Sau đó chọn database `smartscan`, mở Query Tool mới và chạy toàn bộ script ở bước 2. Nếu dùng `psql`, kết nối vào `postgres`, chạy lệnh trên, rồi chuyển database bằng `\connect smartscan` trước khi chạy schema.

### 2. Tạo sequence, bảng và chỉ mục

```sql
CREATE SEQUENCE IF NOT EXISTS document_code_seq START WITH 1;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(30) NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(10) NOT NULL DEFAULT 'user'
        CHECK (role IN ('user', 'admin')),
    locked BOOLEAN NOT NULL DEFAULT FALSE,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_uq
    ON users (LOWER(username));

CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    code VARCHAR(12) NOT NULL UNIQUE,
    title VARCHAR(150) NOT NULL,
    type VARCHAR(20) NOT NULL
        CHECK (type IN ('hoa_don', 'hop_dong', 'giay_to', 'bien_ban', 'khac')),
    description VARCHAR(500) NOT NULL DEFAULT '',
    original_path TEXT,
    processed_path TEXT,
    process_mode VARCHAR(10)
        CHECK (process_mode IS NULL OR process_mode IN ('color', 'gray', 'bw')),
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS documents_owner_created_idx
    ON documents (owner_id, created_at DESC);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    actor_username VARCHAR(30) NOT NULL,
    action VARCHAR(40) NOT NULL CHECK (action IN (
        'LOGIN_SUCCESS', 'LOGIN_FAIL', 'LOGOUT', 'REGISTER',
        'PASSWORD_CHANGE', 'PROCESS_IMAGE', 'DOC_CREATE', 'DOC_UPDATE',
        'DOC_DELETE', 'DOC_COPY', 'DOC_IMPORT', 'DOC_EXPORT',
        'ADMIN_ROLE_CHANGE', 'ADMIN_LOCK', 'ADMIN_UNLOCK',
        'ADMIN_RESET_PASSWORD'
    )),
    document_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
    detail TEXT,
    ip VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_document_created_idx
    ON audit_logs (document_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx
    ON audit_logs (created_at DESC);

CREATE TABLE IF NOT EXISTS uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    document_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
    original_path TEXT NOT NULL,
    processed_path TEXT,
    step_paths JSONB NOT NULL DEFAULT '[]'::JSONB,
    mode VARCHAR(10) CHECK (mode IS NULL OR mode IN ('color', 'gray', 'bw')),
    params JSONB,
    warning TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS uploads_owner_created_idx
    ON uploads (owner_id, created_at DESC);

-- connect-pg-simple dùng sid, sess, expire và chỉ mục hết hạn này.
CREATE TABLE IF NOT EXISTS "session" (
    sid VARCHAR NOT NULL COLLATE "default",
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL,
    CONSTRAINT session_pkey PRIMARY KEY (sid)
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire"
    ON "session" (expire);
```

`document_code_seq` cấp số cho API tạo mã dạng `TL-0001`; API phải lấy số bằng `nextval('document_code_seq')` và không nhận mã từ trình duyệt. `audit_logs.document_id` được đặt thành `NULL` khi xóa tài liệu để giữ nhật ký. Cấu trúc `session` theo [schema connect-pg-simple](https://github.com/voxpelli/node-connect-pg-simple/blob/main/table.sql); thư viện cũng có thể tự tạo bảng khi bật `createTableIfMissing`.

Đặt `DATABASE_URL` trong `.env` theo cổng PostgreSQL đang chạy, ví dụ `postgresql://postgres:mat_khau@localhost:5432/smartscan`. Thay `5432` bằng cổng instance thực tế.

## Cài đặt

1. Sao chép `.env.example` thành `.env`; cập nhật `DATABASE_URL` và `SESSION_SECRET`.
2. Cài gói JavaScript: `npm install`.
3. Tạo môi trường Python 3.14: `py -3.14 -m venv server/python/.venv` (Windows); dùng `python3.14 -m venv server/python/.venv` trên macOS/Linux.
4. Cài OpenCV: `.\server\python\.venv\Scripts\python.exe -m pip install -r server/python/requirements.txt` (Windows); dùng `./server/python/.venv/bin/python -m pip install -r server/python/requirements.txt` trên macOS/Linux.
5. Chạy giao diện và API: `npm run dev`.

Vite phục vụ client tại `http://localhost:5173`; API chạy tại `http://localhost:3000/api`. Vite chuyển tiếp request `/api` sang Express. Trong `.env`, đặt `PYTHON_EXECUTABLE` thành `server/python/.venv/Scripts/python.exe` trên Windows hoặc `server/python/.venv/bin/python` trên macOS/Linux.

## Cấu trúc

- `client/`: React, định tuyến và CSS.
- `server/src/`: Express, cấu hình, truy vấn DB và middleware.
- `server/db/migrations/`: migration SQL đánh số.
- `server/python/`: CLI xử lý ảnh OpenCV.
- `server/storage/`: file runtime riêng tư; không commit và không phục vụ tĩnh.


Khung hiện có trang khởi đầu, endpoint `GET /api/health`, cấu hình PostgreSQL và hợp đồng CLI Python. Các màn hình, migration dữ liệu, xác thực, CRUD và pipeline xử lý ảnh sẽ được bổ sung theo kế hoạch đồ án.
