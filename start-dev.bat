@echo off
chcp 65001 >nul
title Khởi Chạy DTFF Shop Game
echo ========================================================
echo        ĐANG KHỞI CHẠY HỆ THỐNG SHOP GAME DTFF
echo ========================================================
echo 1. Khởi động Backend Laravel API trên cổng 8000...
start "DTFF Backend API (Port 8000)" cmd /k "cd /d %~dp0backend && php artisan serve --port=8000"

echo 2. Khởi động Frontend Next.js trên cổng 3000...
start "DTFF Frontend Web (Port 3000)" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 3 /nobreak >nul
echo 3. Đang mở trình duyệt vào shop...
start http://localhost:3000

echo ========================================================
echo  ✓ Hệ thống đã khởi chạy thành công!
echo  - Trang web shop: http://localhost:3000
echo  - API Backend:    http://127.0.0.1:8000/api/v1
echo  - Trang Admin:    http://localhost:3000/admin (Xem mat khau trong .env / su dung php artisan admin:reset-password)
echo ========================================================
pause
