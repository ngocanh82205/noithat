@echo off
chcp 65001 >nul
echo ========================================================
echo   GS LUXURY - KHỞI ĐỘNG HỆ THỐNG (BACKEND ^& FRONTEND)
echo ========================================================

if not exist "backend\.env" (
    echo [INFO] Tao backend\.env tu backend\.env.example...
    copy "backend\.env.example" "backend\.env" >nul
)

if not exist "frontend\.env.local" (
    echo [INFO] Tao frontend\.env.local tu frontend\.env.example...
    copy "frontend\.env.example" "frontend\.env.local" >nul
)

echo [1/2] Đang khởi động Backend API (Laravel) tại http://127.0.0.1:8000 ...
start "GS Luxury - Backend API" cmd /k "cd /d %~dp0backend && php artisan serve --port=8000"

echo [2/2] Đang khởi động Frontend (Next.js) tại http://localhost:3000 ...
start "GS Luxury - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================================
echo   CẢ 2 SERVER ĐANG CHẠY!
echo   - Frontend: http://localhost:3000
echo   - Backend:  http://127.0.0.1:8000/api
echo ========================================================
timeout /t 5 >nul
start http://localhost:3000
