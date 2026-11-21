-- Migration 001: Initial schema
-- SmartScan - Nền tảng số hóa và quản lý tài liệu

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

CREATE TABLE IF NOT EXISTS "session" (
    sid VARCHAR NOT NULL COLLATE "default",
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL,
    CONSTRAINT session_pkey PRIMARY KEY (sid)
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire"
    ON "session" (expire);
