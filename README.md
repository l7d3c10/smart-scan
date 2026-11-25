# SmartScan

Web app đồ án số hóa và quản lý tài liệu. Giao diện dùng React/Vite, API dùng Express/PostgreSQL, xử lý ảnh dùng Python/OpenCV.

> 📖 **Xem hướng dẫn cài đặt và chạy chi tiết từ A đến Z tại:** [HUONG_DAN_CHAY_A_DEN_Z.md](file:///d:/smatcan/smart-scan/HUONG_DAN_CHAY_A_DEN_Z.md)

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

`CLIENT_ORIGIN` có thể đặt trong `.env` nếu client không chạy tại `http://localhost:5173`. Dashboard dùng các API đã đăng nhập `GET /api/stats/summary`, `/api/stats/monthly` và `/api/stats/by-type`.

### Tài khoản mẫu (lần chạy đầu)

Sau khi áp dụng `001_initial_schema.sql` và `002_auth_bootstrap.sql`, đặt các biến dưới đây trong `.env` rồi chạy `npm run seed:auth --workspace @smartscan/server`. Script tạo một Admin và một User, băm mật khẩu bằng bcrypt và chỉ lưu hash trong PostgreSQL. Chạy lại script sẽ đặt lại mật khẩu/vai trò và mở khóa đúng hai tài khoản được cấu hình.

```dotenv
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_PASSWORD=AdminDev123
SEED_USER_USERNAME=user_demo
SEED_USER_PASSWORD=UserDev123
```

Hãy thay mật khẩu mẫu bằng mật khẩu riêng trước khi sử dụng dữ liệu thật. API xác thực hiện có `GET /api/auth/csrf`, `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout` và `GET /api/auth/me`; cookie session là `httpOnly`, session được lưu trong PostgreSQL.

Vite phục vụ client tại `http://localhost:5173`; API chạy tại `http://localhost:3000/api`. Vite chuyển tiếp request `/api` sang Express. Trong `.env`, đặt `PYTHON_EXECUTABLE` thành `server/python/.venv/Scripts/python.exe` trên Windows hoặc `server/python/.venv/bin/python` trên macOS/Linux.

## Cấu trúc

- `client/`: React, định tuyến và CSS.
- `server/src/`: Express, cấu hình, truy vấn DB và middleware.
- `server/db/migrations/`: migration SQL đánh số.
- `server/python/`: CLI xử lý ảnh OpenCV.
- `server/storage/`: file runtime riêng tư; không commit và không phục vụ tĩnh.


## Cấu trúc dự án và Phân chia Module

Dự án được phân tách rõ ràng cho 3 thành viên:

### Người 1 – Nền tảng và Quản lý Tài liệu (ĐÃ HOÀN THÀNH VÀ KIỂM THỬ)
- **Frontend**:
  - Design System chuyên nghiệp (`tokens.css`, `reset.css`, `layout.css`, `components.css`).
  - Layout quản trị SaaS: Sidebar (với trạng thái hoạt động & badge "Sắp có"), Topbar breadcrumb & avatar.
  - S04: Danh sách tài liệu (`/tai-lieu`) với thanh thống kê, tìm kiếm debounced, lọc loại, sắp xếp, phân trang, skeleton loading, empty state, xóa qua confirm modal.
  - S05: Thêm tài liệu mới (`/tai-lieu/them`) với validation inline, mã tài liệu tự động cấp, panel hướng dẫn 2 cột, toast notification.
  - S06: Chỉnh sửa tài liệu (`/tai-lieu/:id/sua`).
  - S07: Chi tiết tài liệu (`/tai-lieu/:id`) chia 2 khu vực: Image Viewer (Tab Ảnh gốc / Ảnh đã xử lý, thanh công cụ zoom/rotate) & Panel thông tin chi tiết.
  - UI Components: Button, Badge, Input, Select, SearchInput, Modal, ConfirmDialog, Toast, Skeleton, Pagination, EmptyState.
- **Backend & Database**:
  - PostgreSQL schema (`001_initial_schema.sql`) và seed 30 tài liệu mẫu (`001_seed_data.sql`).
  - API endpoints:
    - `GET /api/health`
    - `GET /api/health/db`
    - `GET /api/documents` (tìm kiếm, lọc theo loại, sắp xếp, phân trang)
    - `GET /api/documents/:id`
  - `POST /api/documents` (tự động cấp mã `TL-XXXX` qua sequence, validation chặt chẽ; chủ sở hữu lấy từ phiên đăng nhập)
    - `PUT /api/documents/:id` (cập nhật thông tin, cập nhật `updated_at`)
    - `DELETE /api/documents/:id` (xóa an toàn)
  - `POST /api/uploads` và `GET /api/uploads/:id/original` (upload JPG/PNG tối đa 5 MB, file riêng tư theo chủ sở hữu)
  - `POST /api/admin/users/:id/lock` và `/unlock` (Admin khóa/mở tài khoản)
  - Parameterized SQL queries chống SQL Injection, xử lý lỗi tập trung, CORS hỗ trợ Vite client.

### Người 2 – Xử lý ảnh (OpenCV / Python)
- Module: `server/python/` và các bảng `uploads`.
- Endpoint cần tích hợp:
  - `POST /api/documents/:id/upload` (hoặc upload qua màn hình Tải lên `/tai-len`).
  - Thực thi CLI `server/python/process.py` với các tham số `--input`, `--output`, `--mode` (color, gray, bw), canny, kernel.
  - Cập nhật `original_path` và `processed_path` trong bảng `documents`.
- Điểm gắn kết trên Frontend:
  - Tab "Ảnh gốc" và "Ảnh đã xử lý" tại trang `DocumentDetailPage.jsx` đã được xây dựng sẵn giao diện và tự động hiển thị ảnh khi `original_path`/`processed_path` có dữ liệu.

### Người 3 – Bảo mật, Xác thực & Phân quyền
- Module: `session`, `users`, `audit_logs`.
- Nhiệm vụ:
  - Đăng ký, đăng nhập (`POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/logout`).
  - Session store qua `connect-pg-simple` (bảng `session` đã được tạo sẵn trong migration `001_initial_schema.sql`).
  - CSRF protection và RBAC middleware (Admin / User).
  - Ghi nhật ký vào bảng `audit_logs` khi có hành động liên quan đến tài liệu (`DOC_CREATE`, `DOC_UPDATE`, `DOC_DELETE`).
- Điểm gắn kết trên Backend:
  - Gắn middleware xác thực trước các routes trong `server/src/routes/document.routes.js`.
  - Thay thế `owner_id = 1` mặc định bằng `req.session.userId`.
- Điểm gắn kết trên Frontend:
  - Gắn các routes đăng nhập, bảo vệ PrivateRoute và hiển thị thông tin người dùng trên Topbar avatar.

