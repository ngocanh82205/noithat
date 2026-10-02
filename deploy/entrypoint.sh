#!/bin/bash
# Khởi động bản deploy 1 container: Laravel API (php-fpm) + Next.js storefront (node) sau nginx.
set -Eeuo pipefail
cd /var/www

export PORT="${PORT:-10000}"

# --- URL công khai -----------------------------------------------------------
# Render cung cấp RENDER_EXTERNAL_URL (https://<ten-dich-vu>.onrender.com).
if [[ -z "${APP_URL:-}" ]]; then
    export APP_URL="${RENDER_EXTERNAL_URL:-http://localhost:${PORT}}"
fi
APP_URL="${APP_URL%/}"
export FRONTEND_URL="${FRONTEND_URL:-$APP_URL}"
# URL quay về sau thanh toán & IPN mặc định theo chính domain này (sandbox MoMo/VNPAY)
export VNPAY_RETURN_URL="${VNPAY_RETURN_URL:-$APP_URL/order-success}"
export VNPAY_IPN_URL="${VNPAY_IPN_URL:-$APP_URL/api/vnpay/ipn}"
export MOMO_REDIRECT_URL="${MOMO_REDIRECT_URL:-$APP_URL/order-success}"
export MOMO_IPN_URL="${MOMO_IPN_URL:-$APP_URL/api/momo/ipn}"

# --- APP_KEY ------------------------------------------------------------------
# Render "generateValue" sinh chuỗi ngẫu nhiên không đúng định dạng Laravel (base64:<32 byte>).
# Dẫn xuất khóa 32 byte ổn định từ chuỗi đó (giữ nguyên qua các lần khởi động lại).
if [[ -z "${APP_KEY:-}" ]]; then
    echo "APP_KEY chưa được đặt. Trên Render, render.yaml tự sinh giá trị này." >&2
    exit 1
fi
if [[ "$APP_KEY" != base64:* ]]; then
    APP_KEY="$(php -r 'echo "base64:".base64_encode(hash("sha256", getenv("APP_KEY"), true));')"
    export APP_KEY
fi

# Cho phép chạy lệnh bảo trì: docker run IMAGE php artisan ...
if (( $# > 0 )); then
    exec su-exec www-data "$@"
fi

# --- Nginx --------------------------------------------------------------------
if [[ ! "$PORT" =~ ^[0-9]{1,5}$ ]]; then
    echo "PORT không hợp lệ: $PORT" >&2
    exit 1
fi
envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/http.d/default.conf

mkdir -p storage/framework/{cache/data,sessions,views} storage/logs storage/app/public bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
su-exec www-data php artisan storage:link --force >/dev/null 2>&1 || true

echo "==> Cache cấu hình Laravel"
su-exec www-data php artisan config:cache

# --- Database -----------------------------------------------------------------
if [[ "${RUN_MIGRATIONS:-true}" == "true" ]]; then
    echo "==> Chạy migration (chờ database sẵn sàng)"
    for attempt in $(seq 1 15); do
        if su-exec www-data php artisan migrate --force --no-interaction; then
            break
        fi
        if (( attempt == 15 )); then
            echo "Không kết nối được database sau 15 lần thử" >&2
            exit 1
        fi
        echo "   database chưa sẵn sàng, thử lại sau 4s ($attempt/15)"
        sleep 4
    done
fi

# DatabaseSeeder chỉ nạp dữ liệu mẫu khi bảng còn trống -> an toàn khi chạy mỗi lần khởi động
if [[ "${RUN_SEEDERS:-true}" == "true" ]]; then
    echo "==> Nạp dữ liệu mẫu (bỏ qua nếu đã có)"
    su-exec www-data php artisan db:seed --force --no-interaction
fi

su-exec www-data php artisan route:cache
su-exec www-data php artisan view:cache

nginx -t
php-fpm -t

# --- Khởi động 3 tiến trình; một cái dừng thì dừng cả container -------------
server_pids=()
cleanup() {
    trap - EXIT TERM INT
    if (( ${#server_pids[@]} )); then
        kill -TERM "${server_pids[@]}" 2>/dev/null || true
        wait "${server_pids[@]}" 2>/dev/null || true
    fi
}
trap cleanup EXIT
trap 'exit 0' TERM INT

php-fpm -F &
server_pids+=("$!")

(
    cd /opt/frontend
    exec su-exec www-data env \
        PORT=3000 HOSTNAME=127.0.0.1 NODE_ENV=production \
        NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=192}" \
        INTERNAL_API_URL="http://127.0.0.1:${PORT}/api" \
        node server.js
) &
server_pids+=("$!")

nginx -g 'daemon off;' &
server_pids+=("$!")

echo "==> GS Luxury đang chạy tại $APP_URL"

status=0
wait -n "${server_pids[@]}" || status=$?
echo "Một tiến trình đã dừng (status $status), dừng container" >&2
exit 1
