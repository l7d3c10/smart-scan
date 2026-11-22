# Kiểm thử bảo mật SmartScan

Tài liệu này mô tả sáu kịch bản kiểm tra thủ công trong môi trường local với dữ liệu giả. Không chạy trên dữ liệu thật. Dùng hai User (`user_a`, `user_b`) và một Admin riêng; không ghi mật khẩu thật vào báo cáo.

## Chuẩn bị

1. Khởi động PostgreSQL và ứng dụng; đăng nhập bằng các tài khoản kiểm thử.
2. Tạo một tài liệu và một ảnh upload bằng `user_a`; ghi lại ID tài liệu và UUID upload.
3. Lấy cookie phiên và CSRF token bằng trình duyệt DevTools hoặc công cụ API. Mọi request ghi cần cookie phiên cùng header `X-CSRF-Token`.
4. Ghi kết quả và mã lỗi thực tế vào bảng cuối tài liệu.

## Sáu kịch bản

| # | Kịch bản | Cách thử | Kết quả mong đợi |
|---|---|---|---|
| 1 | SQL injection | Mở danh sách bằng `GET /api/documents?search=%27%20OR%201%3D1%20--` khi đăng nhập `user_a`. | Chuỗi được xử lý như từ khóa; chỉ trả tài liệu thuộc `user_a`, không phát sinh lỗi SQL hay lộ dữ liệu User khác. |
| 2 | XSS lưu trữ | Tạo tài liệu có tiêu đề `<img src=x onerror=alert(1)>` bằng API có session và CSRF; mở danh sách, chi tiết và nhật ký. | Chuỗi hiển thị như văn bản đã escape; không bật hộp thoại và không tạo HTML hoạt động. |
| 3 | IDOR tài liệu | Đăng nhập `user_b`, gọi `GET /api/documents/{document_id_của_user_a}`; sau đó thử một ID không tồn tại. | Cả tài liệu của người khác và ID không tồn tại đều trả cùng phản hồi 403 cho User. Admin được phép xem tài liệu tồn tại. |
| 4 | Upload giả mạo | Gửi `POST /api/uploads` với file `.php` đổi tên `.jpg`, MIME `image/jpeg`, nội dung không có magic bytes JPEG/PNG. | Server từ chối 415; không tạo bản ghi upload hay file trong storage. File trên 5 MB phải bị từ chối 413. |
| 5 | Truy cập ảnh riêng tư | Với UUID upload của `user_a`, gọi `GET /api/uploads/{uuid}/original` khi chưa đăng nhập, rồi bằng `user_b`, rồi bằng `user_a`. | Chưa đăng nhập nhận 401; User khác nhận 403; chủ ảnh nhận 200. Admin có thể xem theo chính sách hiện tại. |
| 6 | Tham số xử lý ảnh bất thường | Khi API xử lý ảnh X5 được tích hợp, gửi `kernel=abc`, `blockSize=2`, giá trị ngoài miền hoặc chuỗi chứa ký tự lệnh. | Server trả 400/422, không chạy lệnh ngoài dự kiến và không tạo file kết quả. **Đang chờ X5; repo hiện chưa có API xử lý ảnh để chạy kịch bản này.** |

## Kết quả chạy

| # | Trạng thái | Ghi chú / mã lỗi |
|---|---|---|
| 1 | Chưa chạy |  |
| 2 | Chưa chạy |  |
| 3 | Chưa chạy |  |
| 4 | Chưa chạy |  |
| 5 | Chưa chạy |  |
| 6 | Chờ X5 |  |

