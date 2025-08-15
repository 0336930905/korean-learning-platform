# Hướng dẫn đẩy dự án lên GitHub

## Bước 1: Cài đặt Git

1. Truy cập: https://git-scm.com/download/win
2. Tải file "64-bit Git for Windows Setup"
3. Chạy file installer
4. Trong quá trình cài đặt:
   - Chọn "Git from the command line and also from 3rd-party software"
   - Các tùy chọn khác để mặc định
5. Khởi động lại VS Code sau khi cài đặt

## Bước 2: Kiểm tra Git đã cài đặt

Mở terminal mới và chạy:
```cmd
git --version
```

Nếu hiển thị phiên bản Git thì đã cài đặt thành công.

## Bước 3: Chạy script tự động

```cmd
git-commands.bat
```

Hoặc chạy từng lệnh thủ công:

```cmd
git init
git config user.name "Tên của bạn"
git config user.email "email@example.com"
git add .
git commit -m "Initial commit: Korean Language Learning Platform"
git remote add origin https://github.com/0336930905/korean-learning-platform.git
git branch -M main
git push -u origin main
```

## Bước 4: Xác nhận

Truy cập https://github.com/0336930905/korean-learning-platform để xem dự án đã được upload thành công.

## Lưu ý

- Đảm bảo đã cài đặt Git trước khi chạy script
- Khởi động lại VS Code sau khi cài Git
- Sử dụng thông tin GitHub của bạn khi config user.name và user.email
