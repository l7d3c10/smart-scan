-- Migration 002: Bảo đảm schema cho xác thực, nhật ký và phiên đăng nhập.
-- An toàn khi chạy trên database đã áp dụng 001_initial_schema.sql.

ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(10) NOT NULL DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;
CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_uq ON users (LOWER(username));

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
CREATE INDEX IF NOT EXISTS audit_logs_document_created_idx ON audit_logs (document_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs (created_at DESC);

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
CREATE INDEX IF NOT EXISTS uploads_owner_created_idx ON uploads (owner_id, created_at DESC);

CREATE TABLE IF NOT EXISTS "session" (
    sid VARCHAR NOT NULL COLLATE "default",
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL,
    CONSTRAINT session_pkey PRIMARY KEY (sid)
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" (expire);
