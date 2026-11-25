# 🚀 HƯỚNG DẪN KHỞI CHẠY DỰ ÁN SMARTSCAN TỪ A ĐẾN Z
> **SmartScan** là nền tảng số hóa, quản lý tài liệu và xử lý ảnh (OpenCV) trên nền tảng **PERN Stack** (PostgreSQL, Express, React, Node.js).
> Cẩm nang này được biên soạn đầy đủ để bất kỳ thành viên nào khi **clone dự án về máy mới** cũng có thể thiết lập và chạy thành công 100% trong vòng 5 phút.

---

## 📌 MỤC LỤC
1. [Yêu cầu môi trường cài đặt](#1-yêu-cầu-môi-trường-cài-đặt)
2. [TÓM TẮT NHANH 5 BƯỚC CHO THÀNH VIÊN MỚI CLONE](#-tóm-tắt-nhanh-5-bước-cho-thành-viên-mới-clone)
3. [Chi tiết Bước 1: Khởi tạo Cơ sở dữ liệu PostgreSQL](#chi-tiết-bước-1-khởi-tạo-cơ-sở-dữ-liệu-postgresql)
4. [Chi tiết Bước 2: Cấu hình file biến môi trường (.env)](#chi-tiết-bước-2-cấu-hình-file-biến-môi-trường-env)
5. [Chi tiết Bước 3: Cài đặt thư viện và Khởi chạy dự án](#chi-tiết-bước-3-cài-đặt-thư-viện-và-khởi-chạy-dự-án)
6. [Tài khoản đăng nhập dùng thử](#tài-khoản-đăng-nhập-dùng-thử)
7. [Hướng dẫn trải nghiệm & Test các chức năng (DocManager DMS)](#hướng-dẫn-trải-nghiệm--test-các-chức-năng-docmanager-dms)
8. [Khắc phục các lỗi thường gặp (Troubleshooting)](#khắc-phục-các-lỗi-thường-gặp-troubleshooting)

---

## 1. Yêu cầu môi trường cài đặt
Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt sẵn:
- **Node.js**: Phiên bản `20.x` LTS trở lên ([Tải tại nodejs.org](https://nodejs.org/)). Kiểm tra: `node -v`.
- **PostgreSQL**: Phiên bản `15+` đi kèm **pgAdmin 4** ([Tải tại postgresql.org](https://www.postgresql.org/download/)).
- **Git**: Đã cài đặt để clone repo. Kiểm tra: `git -v`.
- **Trình duyệt web**: Google Chrome, Microsoft Edge, Cốc Cốc hoặc Firefox.

---

## ⚡ TÓM TẮT NHANH 5 BƯỚC CHO THÀNH VIÊN MỚI CLONE

Nếu bạn vừa clone mã nguồn về máy tính, thực hiện nhanh 5 bước sau:

```bash
# 1. Đi vào thư mục mã nguồn và cài đặt toàn bộ thư viện:
cd smart-scan
npm install

# 2. Tạo database "smartscan" và nạp dữ liệu (xem chi tiết mục 3 bên dưới)

# 3. Tạo file .env từ file mẫu:
cp .env.example .env
# Mở file .env và sửa lại mật khẩu PostgreSQL máy bạn trong DATABASE_URL

# 4. Chạy đồng thời cả Frontend và Backend bằng ĐÚNG 1 CÂU LỆNH:
npm run dev

# 5. Mở trình duyệt truy cập: http://localhost:5173
# Đăng nhập Admin: admin / Admin123456
```

---

## Chi tiết Bước 1: Khởi tạo Cơ sở dữ liệu PostgreSQL

### 1.1. Tạo Database `smartscan` chuẩn UTF-8
Mở **pgAdmin 4**, đăng nhập vào server PostgreSQL > click vào database mặc định `postgres` > mở **Query Tool** (menu `Tools` > `Query Tool`), dán câu lệnh sau và bấm **F5 (Play ▶)**:

```sql
CREATE DATABASE smartscan WITH TEMPLATE template0 ENCODING 'UTF8';
```
*(Lưu ý: Bắt buộc dùng `TEMPLATE template0 ENCODING 'UTF8'` để hỗ trợ tiếng Việt có dấu hoàn chỉnh và tránh lỗi xung đột mã WIN1252 trên hệ điều hành Windows).*

---

### 1.2. Nạp cấu trúc bảng và dữ liệu mẫu
Trong pgAdmin, chuyển sang database **`smartscan`** vừa tạo, mở **Query Tool** mới và thực thi lần lượt **5 file SQL** có sẵn trong thư mục dự án theo thứ tự:

#### 🔹 File 1: Khởi tạo bảng và chuỗi sinh mã (`document_code_seq`)
- Mở file: `server/db/migrations/001_initial_schema.sql`
- Dán toàn bộ nội dung vào Query Tool và bấm **F5 (Play ▶)**.

#### 🔹 File 2: Nâng cấp bảo mật và chỉ mục tài khoản
- Mở file: `server/db/migrations/002_auth_bootstrap.sql`
- Dán toàn bộ nội dung vào Query Tool và bấm **F5 (Play ▶)**.

#### 🔹 File 3: Nâng cấp tính năng Kho tài liệu mở rộng (Favorites, Trash, Folder column)
- Mở file: `server/db/migrations/003_dms_features.sql`
- Dán toàn bộ nội dung vào Query Tool và bấm **F5 (Play ▶)** *(Backend cũng tự động bổ sung cột nếu thiếu)*.

#### 🔹 File 4: Tạo bảng `folders` và thư mục mặc định
- Mở file: `server/db/migrations/004_folders_table.sql`
- Dán toàn bộ nội dung vào Query Tool và bấm **F5 (Play ▶)** *(Backend cũng tự động tạo nếu thiếu)*.

#### 🔹 File 5: Nạp 30 tài liệu mẫu đa dạng (Hóa đơn, Hợp đồng, Biên bản...)
- Mở file: `server/db/seeds/001_seed_data.sql`
- Dán toàn bộ nội dung vào Query Tool và bấm **F5 (Play ▶)**.

---

### 1.3. Kích hoạt mật khẩu tài khoản Admin và User
Để đảm bảo mật khẩu được băm chuẩn thuật toán `bcrypt` và đăng nhập được ngay, mở Query Tool của database `smartscan` và chạy đoạn SQL sau:

```sql
-- Cập nhật mật khẩu chuẩn bcrypt cho Admin: admin / Admin123456
UPDATE users 
SET password_hash = '$2b$12$AGE/3az27wiPgCa6IDerK.nlqIsCLIf.2ucXqtGEO/XxjzbU38Ceu', 
    role = 'admin', 
    locked = false, 
    failed_attempts = 0 
WHERE username = 'admin';

-- Tạo tài khoản User thường: user_demo / User123456
INSERT INTO users (username, password_hash, role, locked, failed_attempts)
VALUES ('user_demo', '$2b$12$zOOTo/BO0lTJFxp0Eyz2AO1IsjPRNyeJ5DMZzT.4RUzjPNIzpGFfO', 'user', false, 0)
ON CONFLICT (LOWER(username)) DO UPDATE 
SET password_hash = EXCLUDED.password_hash, locked = false, failed_attempts = 0;
```

---

## Chi tiết Bước 2: Cấu hình file biến môi trường (.env)

Tại thư mục gốc `smart-scan/`, sao chép file mẫu `.env.example` thành file **`.env`**:
- Trên Windows: Copy file `.env.example` và dán lại, đổi tên thành `.env`.
- Hoặc gõ lệnh terminal: `cp .env.example .env`

Nội dung file `.env` chuẩn:
```dotenv
PORT=3000

# Cấu hình kết nối PostgreSQL: postgresql://<user>:<password>@localhost:<port>/smartscan
# Đổi "postgres" thành mật khẩu cài PostgreSQL trên máy bạn
# Cổng thường là 5432 (mặc định) hoặc 5433
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/smartscan

SESSION_SECRET=replace-with-a-random-secret-of-at-least-32-characters
STORAGE_ROOT=server/storage
PYTHON_EXECUTABLE=server/python/.venv/Scripts/python.exe
VITE_API_PROXY_TARGET=http://localhost:3000
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_PASSWORD=Admin123456
SEED_USER_USERNAME=user_demo
SEED_USER_PASSWORD=User123456
```

> **Lưu ý quan trọng về cổng kết nối:**
> - Nếu PostgreSQL trên máy bạn cài ở cổng mặc định `5432`, hãy đặt cổng là `5432`.
> - Nếu máy bạn dùng cổng `5433`, hãy sửa thành `localhost:5433`.

---

## Chi tiết Bước 3: Cài đặt thư viện và Khởi chạy dự án

Mở **Terminal** (hoặc PowerShell / Command Prompt) trên máy tính:

1. Di chuyển vào thư mục dự án `smart-scan`:
   ```bash
   cd smart-scan
   ```

2. Cài đặt các thư viện phụ thuộc cho cả client và server:
   ```bash
   npm install
   ```

3. Khởi chạy đồng thời cả Frontend (Vite) và Backend (Express):
   ```bash
   npm run dev
   ```

   Khi màn hình hiện thông báo:
   ```text
   [server] SmartScan API đang chạy tại http://localhost:3000/api
   [client] ➜ Local: http://localhost:5173/
   ```
   nghĩa là cả hai hệ thống đã chạy thành công!

   *(Nếu muốn chạy riêng biệt 2 terminal độc lập, bạn mở 2 tab terminal:*
   - *Terminal 1 (Backend): `npm run dev --workspace @smartscan/server`*
   - *Terminal 2 (Frontend): `npm run dev --workspace @smartscan/client`)*

4. Truy cập giao diện trên trình duyệt:
   👉 **[http://localhost:5173](http://localhost:5173)**
   *(Hệ thống sẽ tự động chuyển hướng đến màn hình Đăng nhập `http://localhost:5173/dang-nhap`)*

---

## Tài khoản đăng nhập dùng thử

| Vai trò | Tên đăng nhập | Mật khẩu | Quyền hạn |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin` | `Admin123456` | Toàn quyền: Xem tất cả tài liệu, Quản lý người dùng, Xem nhật ký bảo mật |
| **Người dùng (User)** | `user_demo` | `User123456` | Quản lý tài liệu của chính mình, tải ảnh lên, nhập Excel/JSON |

---

## Hướng dẫn trải nghiệm & Test các chức năng (DocManager DMS)

### 1. Màn hình Quản lý tài liệu (S04 - `/tai-lieu`)
- **Chuyển đổi Dạng Bảng (Table View) & Dạng Lưới Thẻ (Grid View)**:
  - Bấm nút icon chuyển đổi trên thanh tiêu đề để xem tài liệu dạng bảng hoặc dạng thẻ lưới hiện đại có thumbnail icon, ngày cập nhật và menu thao tác nhanh.
- **Xem tổng quan thông tin chính (Quick View Modal)**:
  - Bấm vào icon **Ngôi sao lấp lánh ✨** trên từng dòng hoặc thẻ để mở cửa sổ kích thước hợp lý, hiển thị toàn bộ các thông tin cốt lõi (Mã, Tên, Loại, Thư mục, Trạng thái, Mô tả, Người tạo, Ngày tạo) mà không cần chuyển trang.
- **Xem chi tiết tài liệu (Right Drawer)**:
  - Bấm vào icon **Con mắt 👁️** hoặc click trực tiếp vào tiêu đề tài liệu để mở ngăn kéo bên phải (Right Drawer) trượt ra mượt mà.
- **Đánh dấu Yêu thích ⭐**:
  - Bấm vào icon **Ngôi sao ⭐** trên mỗi dòng để ghim tài liệu vào mục Yêu thích.
- **Chia sẻ tài liệu & Phân quyền (Share Modal)**:
  - Bấm icon **Chia sẻ 🔗** để mở cửa sổ phân quyền người nhận (Người xem, Biên tập, Tải về) và sao chép liên kết truy cập an toàn.
- **Di chuyển tài liệu vào Thư mục (Move Modal)**:
  - Bấm icon **Di chuyển 📁** trên từng dòng hoặc chọn nhiều bản ghi rồi bấm *"Di chuyển (N)"* trên thanh nổi để phân loại vào các thư mục mục tiêu hoặc tạo thư mục mới tức thì.
- **Lịch sử phiên bản (Version History Modal)**:
  - Bấm icon **Đồng hồ Lịch sử 🕒** để xem cây các phiên bản (v1.0, v1.1, v2.0), người sửa đổi và khôi phục về phiên bản trước.
- **Tối ưu tìm kiếm Keyword (Elasticsearch / Meilisearch pattern)**:
  - Gõ từ khóa vào ô tìm kiếm: Tự động tách từ khóa token và truy vấn đa trường trên cả *Mã tài liệu*, *Tên*, *Loại*, *Mô tả*, *Thư mục*.
  - Bấm vào các thẻ gợi ý nhanh: `#Hóa đơn`, `#Hợp đồng`, `#Biên bản`, `#Đã sao chép`.
- **Bộ lọc có mũi tên trỏ xuống**: Dropdown lọc loại và số dòng/trang có icon mũi tên `ChevronDown` chuẩn phong cách DocManager.
- **Sao chép tài liệu & Chú thích "Đã sao chép"**:
  - Bấm nút icon **Sao chép** trên từng dòng hoặc chọn nhiều bản ghi rồi bấm *"Sao chép N bản ghi"*.
  - Bản ghi được nhân bản sẽ tự sinh mã mới và hiển thị nhãn nổi bật **`📋 Đã sao chép`**.
- **Chọn nhiều & Thanh nổi (Bulk Actions)**: Tích chọn checkbox ở các dòng -> Thanh nổi màu xanh xuất hiện cho phép Xóa, Di chuyển hoặc Sao chép hàng loạt.
- **Ẩn / Hiện cột**: Bấm nút *"Cột hiển thị"* để bật/tắt các cột tùy ý (tự động lưu vào `localStorage`).
- **Phím tắt nhanh**:
  - `Ctrl + K` hoặc `/`: Nhảy nhanh con trỏ vào ô tìm kiếm.
  - `N`: Thêm mới tài liệu.
  - `E`: Chỉnh sửa tài liệu đang chọn (có thông báo hướng dẫn khi chưa chọn).
  - `Delete`: Xóa các tài liệu đang chọn (có thông báo hướng dẫn khi chưa chọn).
  - `?` (hoặc `Shift + /`): Mở bảng tra cứu phím tắt.
  - `Esc`: Đóng cửa sổ Drawer hoặc Modal.

---

### 2. Các trang phân hệ kho tài liệu DocManager
- **Quản lý Thư mục (`/thu-muc`)**: Hiển thị cây danh bạ thư mục (`Tài liệu nội bộ`, `Dự án IT & Công nghệ`, `Hợp đồng đối tác`, `Chứng từ tài chính`...), thống kê số lượng tài liệu từng thư mục, tạo thư mục mới và mở xem tài liệu theo thư mục.
- **Đã đánh dấu sao Yêu thích (`/yeu-thich`)**: Quản lý tập trung toàn bộ tài liệu quan trọng được ghim sao, cho phép bỏ sao nhanh hoặc xem chi tiết.
- **Mở gần đây (`/gan-day`)**: Dòng thời gian tài liệu vừa được truy cập hoặc chỉnh sửa, sắp xếp theo thứ tự thời gian mới nhất.
- **Thùng rác & Khôi phục (`/thung-rac`)**: Quản lý các tài liệu đã xóa tạm thời (soft-deleted), hỗ trợ khôi phục tài liệu về vị trí cũ hoặc dọn sạch vĩnh viễn thùng rác.

---

### 3. Thêm mới (S05) & Chỉnh sửa tài liệu (S06)
- **Mã tự động cấp dự kiến**: Gọi API tự động hiển thị mã tiếp theo (ví dụ `TL-0031`).
- **Bộ đếm ký tự trực quan**: Ô Tiêu đề đếm đến 150 ký tự (`0/150`), ô Mô tả đếm đến 500 ký tự (`0/500`).
- **Cảnh báo rời trang**: Tự động cảnh báo nếu người dùng đã nhập dữ liệu nhưng chưa bấm Lưu.

---

### 4. Chi tiết tài liệu (S07 - `/tai-lieu/:id`)
- **Trình xem ảnh tương tác**: Đầy đủ các nút **Phóng to**, **Thu nhỏ**, **Xoay 90 độ**, **Toàn màn hình**, **Tải ảnh về**.
- **Lịch sử thao tác**: Hiển thị bảng 5 hành động gần nhất của tài liệu lấy từ nhật ký bảo mật `audit_logs`.
- **Nhân bản**: Bấm nút *"Nhân bản tài liệu"* để nhân bản ngay tại trang chi tiết.

---

### 5. Nhập dữ liệu từ Excel / JSON (S11 - `/tai-lieu/nhap`)
- Bấm *"Tải file mẫu JSON"* để lấy file chuẩn mẫu.
- Kéo thả file `.json` hoặc `.csv` vào vùng kéo thả.
- Hệ thống tự động kiểm tra tính hợp lệ từng dòng, hiển thị bảng xem trước 5 dòng đầu và bảng chi tiết các dòng bị lỗi.
- Bấm *"Nhập N dòng hợp lệ"* để lưu toàn bộ vào cơ sở dữ liệu qua Transaction.

---

### 6. Chế độ Sáng / Tối (Dark / Light Mode)
- Bấm vào icon **Mặt trăng 🌙 / Mặt trời ☀️** trên thanh Topbar ở góc trên bên phải.
- Giao diện sẽ chuyển đổi mượt mà giữa chế độ sáng và chế độ tối sang trọng, tự động lưu lại cấu hình.

---

### 7. Các màn hình chức năng mở rộng
- **Tải ảnh lên (S08 - `/tai-len`)**: Thanh tiến trình 3 bước, kéo thả ảnh JPG/PNG tối đa 5MB.
- **Xử lý ảnh OpenCV (S09 - `/tai-len/:uploadId/xu-ly`)**: 3 chế độ (Màu, Ảnh xám, Đen trắng), tinh chỉnh ngưỡng Canny, Gaussian blur, Adaptive blockSize, dải 4 ảnh bước trung gian.
- **Lưu tài liệu sau xử lý (S10 - `/tai-len/:uploadId/luu`)**: Đặt tên và gắn ảnh đã xử lý vào hồ sơ tài liệu.
- **Hồ sơ cá nhân & Đổi mật khẩu (S12 - `/ho-so`)**: Thông tin người dùng, thanh đo độ mạnh mật khẩu 5 cấp độ.
- **Quản lý người dùng (S13 - `/quan-tri/nguoi-dung`)**: Dành cho Admin, khóa/mở khóa tài khoản, đặt lại mật khẩu.
- **Nhật ký hoạt động bảo mật (S14 - `/quan-tri/nhat-ky`)**: Dành cho Admin, lọc hành động và xuất file JSON.

---

## Khắc phục các lỗi thường gặp (Troubleshooting)

### ❌ Lỗi 1: `new encoding (UTF8) is incompatible with the encoding of the template database (WIN1252)`
- **Nguyên nhân**: PostgreSQL trên Windows dùng template WIN1252.
- **Cách sửa**: Tạo lại database bằng lệnh:
  ```sql
  CREATE DATABASE smartscan WITH TEMPLATE template0 ENCODING 'UTF8';
  ```

### ❌ Lỗi 2: Báo sai mật khẩu khi đăng nhập tài khoản `admin` / `Admin123456`
- **Nguyên nhân**: File seed ban đầu chứa mã hash giữ chỗ (`placeholder_hash`).
- **Cách sửa**: Mở Query Tool trong pgAdmin chạy lại mục [1.3 Kích hoạt mật khẩu tài khoản](#13-kích-hoạt-mật-khẩu-tài-khoản-admin-và-user).

### ❌ Lỗi 3: `ECONNREFUSED 127.0.0.1:5432` hoặc `5433` (Không kết nối được database)
- **Nguyên nhân**: PostgreSQL chưa chạy hoặc sai cổng trong file `.env`.
- **Cách sửa**:
  1. Kiểm tra service PostgreSQL đã được Start chưa trong `services.msc`.
  2. Mở file `.env`, kiểm tra số cổng trong `DATABASE_URL` (thử đổi giữa `5432` và `5433` tùy máy bạn cài).

### ❌ Lỗi 4: `password authentication failed for user "postgres"`
- **Nguyên nhân**: Mật khẩu tài khoản `postgres` trong file `.env` không trùng với mật khẩu lúc bạn cài PostgreSQL.
- **Cách sửa**: Mở file `.env`, tìm dòng `DATABASE_URL` và thay `postgres` bằng mật khẩu đúng của bạn:
  `DATABASE_URL=postgresql://postgres:mat_khau_that_cua_ban@localhost:5432/smartscan`
