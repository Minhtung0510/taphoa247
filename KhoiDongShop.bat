@echo off
title TAP HOA 247 - HE THONG TU DONG
cls

echo ========================================================
echo    KHOI DONG HE THONG SHOP TAP HOA 247 (TU DONG 24/7)
echo    Domain: https://taphoa247.io.vn
echo ========================================================
echo.

:: 1. Kiem tra va bat Cloudflare Tunnel
echo [1/3] Kiem tra Cloudflare Tunnel...
sc query Cloudflared | findstr /i "RUNNING" >nul
if %errorlevel% equ 0 goto CLOUDFLARED_OK
echo     ... Dang khoi dong Cloudflared Service...
net start Cloudflared >nul 2>&1

:CLOUDFLARED_OK
echo     ... Cloudflared: DA SAN SANG.
echo.

:: 2. Kiem tra va khoi dong Backend Laravel (Port 8000)
echo [2/3] Kiem tra Backend Laravel (Port 8000)...
netstat -ano | findstr ":8000" | findstr /i "LISTENING" >nul
if %errorlevel% equ 0 goto BACKEND_RUNNING

echo     ... Dang khoi dong Backend Laravel tren port 8000...
start "TapHoa247_Backend" cmd /k "title TapHoa247_Backend && cd /d C:\Users\Administrator\Desktop\Test\backend && C:\Users\Administrator\AppData\Local\Microsoft\WinGet\Packages\PHP.PHP.8.3_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe artisan serve --host=127.0.0.1 --port=8000"
ping 127.0.0.1 -n 3 >nul
goto BACKEND_DONE

:BACKEND_RUNNING
echo     ... Backend Laravel: DANG HOAT DONG (Port 8000).

:BACKEND_DONE
echo.

:: 3. Kiem tra va khoi dong Frontend Next.js (Port 3000)
echo [3/3] Kiem tra Frontend Next.js (Port 3000)...
netstat -ano | findstr ":3000" | findstr /i "LISTENING" >nul
if %errorlevel% equ 0 goto FRONTEND_RUNNING

echo     ... Dang khoi dong Frontend Next.js tren port 3000...
start "TapHoa247_Frontend" cmd /k "title TapHoa247_Frontend && cd /d C:\Users\Administrator\Desktop\Test\frontend && npm.cmd run start"
ping 127.0.0.1 -n 4 >nul
goto FRONTEND_DONE

:FRONTEND_RUNNING
echo     ... Frontend Next.js: DANG HOAT DONG (Port 3000).

:FRONTEND_DONE
echo.

echo ========================================================
echo    HE THONG TAP HOA 247 DA SAN SANG HOAN TOAN!
echo    Truy cap ngay: https://taphoa247.io.vn
echo ========================================================
echo.
ping 127.0.0.1 -n 2 >nul
start https://taphoa247.io.vn
ping 127.0.0.1 -n 3 >nul
exit
