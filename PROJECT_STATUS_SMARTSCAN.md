# Tiến trình dự án SmartScan

## Cập nhật ngày 23/11/2026

Đã hoàn thành các gói tuần 1 (B1, B2), tuần 2 (B4, B8), tuần 3 (B3, B5), tuần 4 (B6, B13), tuần 5 (B7, B10) và tuần 6 (B9, B11, B12, B14) của Người 3.

## Công việc đã làm

- Thêm migration `002_auth_bootstrap.sql` để bảo đảm các cột khóa tài khoản, chỉ mục tên đăng nhập không phân biệt hoa thường, bảng `audit_logs`, `uploads` và `session`.
- Thêm script `server/db/seeds/002_auth_users.js`. Script lấy thông tin từ biến môi trường, băm mật khẩu bằng bcryptjs, tạo/cập nhật một tài khoản Admin và một tài khoản User. Không có mật khẩu mặc định trong mã nguồn.
- Thêm cấu hình `express-session` với `connect-pg-simple`, lưu session trong PostgreSQL, cookie `httpOnly`, `sameSite=lax`, hết hạn sau 8 giờ và bật `secure` trong production.
- Thêm các API:
  - `GET /api/auth/csrf`
  - `POST /api/auth/register` — kiểm tra username 3–30 ký tự, mật khẩu ít nhất 8 ký tự có chữ và số; role luôn do server đặt là `user`.
  - `POST /api/auth/login` — thông báo lỗi chung, tạo lại session khi đăng nhập thành công.
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
- Ghi audit cho đăng ký, đăng nhập thành công/thất bại và đăng xuất.
- Bật CSRF protection cho các request thay đổi dữ liệu bằng header `X-CSRF-Token`; cập nhật client API để gửi cookie phiên và tự lấy token trước request ghi.
- Cấu hình CORS cho credentialed requests và header CSRF.
- Cập nhật README hướng dẫn migration, tạo tài khoản mẫu và các endpoint auth.
- Thêm middleware `requireAuth`, `requireAdmin` và `requireDocumentAccess`. Middleware đọc tài khoản hiện tại từ database ở backend để role/khóa mới có hiệu lực ngay.
- Bắt buộc đăng nhập trên toàn bộ route `/api/documents`. User chỉ nhận danh sách tài liệu của mình; Admin nhận toàn hệ thống.
- Kiểm tra quyền sở hữu ở backend trước khi xem/sửa/xóa. Tài liệu không tồn tại và tài liệu không thuộc User trả cùng phản hồi 403 cho User; Admin nhận 404 khi tài liệu không tồn tại.
- Bỏ khả năng client tự chọn `owner_id` khi tạo tài liệu; server luôn gán chủ sở hữu là tài khoản trong phiên.
- Thêm màn đăng nhập và đăng ký tiếng Việt, validation username, đo độ mạnh mật khẩu, xác nhận mật khẩu, hiện/ẩn mật khẩu, trạng thái đang gửi, thông báo lỗi và báo đăng ký thành công.
- Bảo vệ các trang ứng dụng bằng session; nếu chưa đăng nhập thì chuyển sang `/dang-nhap` rồi quay lại trang ban đầu sau khi đăng nhập.
- Topbar hiển thị tên, vai trò và nút đăng xuất.
- Khóa tạm tài khoản sau 5 lần đăng nhập sai liên tiếp trong 15 phút; hết thời gian khóa thì bộ đếm được đặt lại. Username không tồn tại dùng hash bcrypt giả để giảm khả năng dò tài khoản qua thời gian phản hồi.
- Thêm giới hạn 10 lần đăng nhập thất bại mỗi IP trong 15 phút. API trả thời gian chờ; màn đăng nhập đếm ngược và vô hiệu hóa nút trong thời gian khóa.
- Thêm API Admin `POST /api/admin/users/:id/lock` và `/unlock`. API kiểm tra quyền Admin, không cho tự khóa hoặc khóa Admin hoạt động cuối cùng, đồng thời ghi audit.
- Thêm API `POST /api/uploads` nhận field multipart `file`, giới hạn 5 MB, chỉ nhận JPG/PNG, đối chiếu phần mở rộng, MIME và magic bytes; file lưu bằng UUID trong thư mục storage riêng, ngoài thư mục tĩnh.
- Thêm `GET /api/uploads/:id/original` có đăng nhập và kiểm tra chủ sở hữu (Admin có thể xem mọi upload); kiểm tra đường dẫn nằm trong storage root, đặt `nosniff` và `private, no-store`.
- Thêm dependency `multer` và `express-rate-limit`.
- Thêm `api.upload(path, file)` ở client để gửi multipart kèm session cookie và CSRF token mà không tự đặt sai `Content-Type` boundary.
- Thêm Helmet với CSP, chặn nhúng trang vào frame, chặn object/script inline và bật HSTS khi chạy production; tắt HSTS/upgrade HTTPS trong môi trường local.
- Cập nhật CORS dùng `CLIENT_ORIGIN` (mặc định `http://localhost:5173`), bật credential, khai báo header CSRF, `Vary: Origin` và cache preflight.
- Siết kiểm tra tham số API tài liệu: kiểu và độ dài tìm kiếm, loại, trang, giới hạn dòng, sort allowlist; body tài liệu chỉ nhận trường text đúng kiểu/kích thước. Query dữ liệu vẫn dùng tham số SQL và tên cột sort lấy từ allowlist.
- Rà soát hiển thị đầu ra: dữ liệu được render bằng JSX mặc định; không dùng `dangerouslySetInnerHTML`.
- Thêm ba API thống kê có xác thực: `GET /api/stats/summary`, `/api/stats/monthly`, `/api/stats/by-type`. User chỉ nhận dữ liệu của mình; Admin nhận toàn hệ thống và thêm tổng số người dùng.
- Thêm dashboard vào `/` với bốn thẻ thống kê (Admin có thêm thẻ người dùng), biểu đồ 12 tháng, biểu đồ theo loại, năm tài liệu gần đây, trạng thái tải/lỗi/rỗng và liên kết tạo/xem tài liệu.
- Bật mục “Tổng quan” trên Sidebar.
- Thêm `helmet`, `chart.js` và `react-chartjs-2`.
- Thêm API `POST /api/auth/change-password`: xác minh mật khẩu hiện tại, kiểm tra mật khẩu mới, ghi audit, thu hồi các phiên khác và tạo lại phiên hiện tại.
- Thêm trang `/ho-so` hiển thị username/vai trò và form đổi mật khẩu có xác nhận.
- Thêm trang lỗi 403, 404, 500; API lỗi 403/404/500 chuyển tới trang tương ứng, lỗi React được ErrorBoundary xử lý. Trang 500 chỉ hiển thị mã tham chiếu, không lộ stack.
- Tạo `TEST-BAOMAT.md` với sáu kịch bản SQL injection, XSS, IDOR, upload giả, truy cập ảnh riêng tư và tham số xử lý ảnh bất thường. Kịch bản xử lý ảnh đang chờ endpoint X5.
- Thêm API `GET /api/documents/export` áp dụng cùng bộ lọc và phạm vi chủ sở hữu hiện tại, giới hạn 50.000 dòng/lần và ghi audit `DOC_EXPORT`.
- Thêm nút xuất JSON và Excel theo bộ lọc hiện tại. File Excel `.xlsx` được tạo bằng OpenXML/ZIP nhẹ ở client; bỏ đường dẫn lưu trữ nội bộ khỏi dữ liệu xuất.
- Dùng `fflate` thay ExcelJS/SheetJS để tránh phụ thuộc có cảnh báo bảo mật; cài dependency ghi nhận 0 lỗ hổng trong lần cài.
- Tạo dịch vụ audit dùng chung; ghi thêm `DOC_CREATE`, `DOC_UPDATE`, `DOC_DELETE` và các thao tác quản trị vai trò, khóa/mở khóa, đặt lại mật khẩu.
- Thêm API Admin `GET /api/admin/audit-logs` với lọc theo từ khóa, hành động, ngày; phân trang 20 dòng và xuất JSON tối đa 10.000 dòng/lần.
- Thêm màn hình `/quan-tri/nhat-ky`, chỉ hiện với Admin, có bộ lọc, phân trang, xuất JSON và hiển thị nội dung log dưới dạng text an toàn.
- Thêm API Admin `GET /api/admin/users`, `POST /api/admin/users/:id/role`, `POST /api/admin/users/:id/reset-password`; giữ API khóa/mở khóa đã có.
- Thao tác đổi vai trò, khóa/mở khóa và đặt lại mật khẩu ghi audit trong cùng transaction. Chặn tự hạ quyền, tự khóa, khóa/hạ quyền Admin hoạt động cuối cùng; đặt lại mật khẩu sẽ thu hồi session của tài khoản đích.
- Thêm màn hình `/quan-tri/nguoi-dung` để tìm/lọc người dùng, đổi vai trò, khóa/mở khóa và đặt lại mật khẩu bằng modal có xác nhận.
- Thêm hai liên kết quản trị trên Sidebar, chỉ hiển thị cho Admin; cả frontend lẫn backend đều chặn User.

## Cách chạy phần cơ sở dữ liệu và seed

1. Tạo database theo hướng dẫn trong README.
2. Chạy lần lượt `server/db/migrations/001_initial_schema.sql` và `server/db/migrations/002_auth_bootstrap.sql`.
3. Đặt `SEED_ADMIN_USERNAME`, `SEED_ADMIN_PASSWORD`, `SEED_USER_USERNAME`, `SEED_USER_PASSWORD` trong `.env`.
4. Chạy `npm run seed:auth --workspace @smartscan/server`.
5. Chạy app bằng `npm run dev`.

## Chưa thuộc phạm vi tuần 1–6

- Giao diện tải ảnh, xử lý ảnh và nối Python thuộc các gói X6–X8 của Người 2.
- Kiểm tra nội dung ảnh sâu bằng bộ giải mã ảnh và dọn upload quá hạn chưa được triển khai.
- Kịch bản bảo mật số 6 chỉ chạy được sau khi Người 2 tích hợp API xử lý ảnh X5.
- Schema gốc `001_initial_schema.sql` đã có sẵn phần lớn bảng auth; migration 002 là bước bảo đảm/nâng cấp tương thích cho database đã khởi tạo.

## Bàn giao

Người 1 và Người 2 có thể dùng `/api/auth/me` để lấy người dùng hiện tại. Các request POST/PUT/DELETE qua client API tự lấy CSRF token. API upload sẵn sàng cho luồng X6–X8: gửi multipart field `file` tới `/api/uploads`, nhận `id` và `originalUrl`, rồi hiển thị ảnh qua URL đó với cookie phiên.

Client production build thành công; các file JavaScript backend đã qua kiểm tra cú pháp. Chưa chạy migration/seed hoặc kiểm thử tích hợp trên database của máy. Trong `TEST-BAOMAT.md`, sáu tình huống chưa được chạy; tình huống xử lý ảnh đang chờ X5.

## Cách thử thủ công các API mới

- Sau khi đăng nhập, tải file bằng `POST /api/uploads` với `multipart/form-data`, field tên `file`.
- Xem ảnh gốc bằng `GET /api/uploads/{id}/original` khi gửi cookie session của đúng chủ upload hoặc Admin.
- Admin khóa/mở tài khoản bằng `POST /api/admin/users/{id}/lock` hoặc `/unlock`, gửi cookie session và `X-CSRF-Token`.
- Admin truy cập giao diện quản lý tại `/quan-tri/nguoi-dung` và nhật ký tại `/quan-tri/nhat-ky`.
- Đăng nhập sai 5 lần vào tài khoản mẫu để nhận khóa tạm 15 phút; thử tiếp cùng IP sẽ chịu giới hạn rate limit.
