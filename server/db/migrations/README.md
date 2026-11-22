# Migration SQL

Đặt migration tại đây theo thứ tự tăng dần, ví dụ `001_create_users.sql`. Chạy migration theo thứ tự và không sửa file đã áp dụng; tạo migration mới để đổi schema.
Áp dụng migration theo thứ tự số: `001_initial_schema.sql`, sau đó `002_auth_bootstrap.sql`.
Migration 002 có thể chạy lại an toàn và bảo đảm các bảng/cột phục vụ xác thực, nhật ký,
upload và PostgreSQL session store.
