# Python/OpenCV

Dùng Python 3.14 để có wheel OpenCV 4.x sẵn dùng. Tạo môi trường ảo từ thư mục gốc:

```powershell
py -3.14 -m venv server/python/.venv
.\server\python\.venv\Scripts\python.exe -m pip install -r server/python/requirements.txt
```

Trên macOS/Linux, dùng `python3.14 -m venv server/python/.venv` và `./server/python/.venv/bin/python -m pip install -r server/python/requirements.txt`.

CLI nhận ảnh đầu vào, đường dẫn kết quả, chế độ `color|gray|bw`, các ngưỡng Canny, kernel làm mờ, block size và thư mục ảnh trung gian. Pipeline OpenCV sẽ được thêm ở gói xử lý ảnh.

Ví dụ trên Windows:

```powershell
.\server\python\.venv\Scripts\python.exe server\python\process.py --input input.jpg --output output.jpg --mode color --steps-dir steps
```
