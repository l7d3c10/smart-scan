# Python/OpenCV

Dùng Python 3.14 để có wheel OpenCV 4.x sẵn dùng. Tạo môi trường ảo từ thư mục gốc:

```powershell
py -3.14 -m venv server/python/.venv
.\server\python\.venv\Scripts\python.exe -m pip install -r server/python/requirements.txt
```

Trên macOS/Linux, dùng `python3.14 -m venv server/python/.venv` và `./server/python/.venv/bin/python -m pip install -r server/python/requirements.txt`.

CLI nhận ảnh đầu vào, đường dẫn kết quả, chế độ `color|gray|bw`, các ngưỡng Canny, kernel làm mờ, block size và thư mục ảnh trung gian. Ảnh cạnh dài trên 2000 px được thu nhỏ trước khi phát hiện viền. Kết quả JSON một dòng được ghi ra stdout; lỗi được ghi ra stderr.

Các bước trung gian: ảnh xám/làm mờ, cạnh Canny, contour tài liệu và ảnh sau nắn. Nếu không tìm thấy viền, ảnh gốc được giữ làm kết quả và JSON có cảnh báo.

### Bộ ca kiểm thử

| Ca | Đặc điểm | Kỳ vọng |
| --- | --- | --- |
| 1 | Tài liệu nghiêng | Phát hiện tứ giác và nắn thẳng |
| 2 | Ảnh tối | Trả ảnh xử lý hoặc cảnh báo nếu thiếu viền |
| 3 | Bóng đổ | Trả ảnh xử lý hoặc cảnh báo nếu thiếu viền |
| 4 | Ảnh rõ | Phát hiện tứ giác, đủ 3 chế độ và 4 ảnh trung gian |

Chạy test: `server/python/.venv/Scripts/python.exe -m unittest discover -s server/python/tests -v` (Windows).

Ví dụ trên Windows:

```powershell
.\server\python\.venv\Scripts\python.exe server\python\process.py --input input.jpg --output output.jpg --mode color --steps-dir steps
```
