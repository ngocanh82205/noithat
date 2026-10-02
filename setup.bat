@echo off
chcp 65001 >nul
echo ========================================================
echo   GS LUXURY - CÀI ĐẶT DỰ ÁN TỰ ĐỘNG
echo ========================================================

if not exist "backend\.env" (
    echo [INFO] Tao file backend\.env tu backend\.env.example...
    copy "backend\.env.example" "backend\.env" >nul
)
if not exist "frontend\.env.local" (
    echo [INFO] Tao file frontend\.env.local tu frontend\.env.example...
    copy "frontend\.env.example" "frontend\.env.local" >nul
)

echo [1/3] Cai dat thu vien Backend (Composer)...
cd /d "%~dp0backend"
call composer install --no-interaction
call php artisan key:generate --force
call php artisan migrate:fresh --seed --force

echo [2/3] Cai dat thu vien Frontend (NPM)...
cd /d "%~dp0frontend"
call npm install

echo ========================================================
echo   CÀI ĐẶT HOÀN TẤT!
echo   Bây giờ bạn có thể chạy start.bat để khởi động website.
echo ========================================================
pause
