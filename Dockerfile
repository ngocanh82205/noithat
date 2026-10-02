# syntax=docker/dockerfile:1
# Bản deploy 1 container cho Render: Next.js storefront + Laravel API + nginx.
# (backend/Dockerfile vẫn giữ để deploy riêng backend nếu cần.)

# ---------- 1. Build frontend (Next.js standalone) ----------
FROM node:20-alpine AS frontend
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
# Trình duyệt gọi API cùng domain (/api); server Next gọi nội bộ qua INTERNAL_API_URL lúc chạy
ENV NEXT_OUTPUT=standalone \
    NEXT_PUBLIC_API_URL=/api \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---------- 2. PHP runtime chung ----------
FROM php:8.2-fpm-alpine AS php-base
RUN apk add --no-cache bash nginx curl gettext su-exec tini ca-certificates nodejs \
        libpng libzip oniguruma libpq \
    && apk add --no-cache --virtual .build-deps $PHPIZE_DEPS \
        libpng-dev libzip-dev oniguruma-dev libpq-dev \
    && docker-php-ext-install -j"$(nproc)" pdo_mysql pdo_pgsql mbstring zip gd bcmath opcache \
    && apk del .build-deps
WORKDIR /var/www

# ---------- 3. Cài thư viện backend ----------
FROM php-base AS backend
COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer
COPY backend/composer.json backend/composer.lock ./
RUN composer install --no-dev --prefer-dist --no-interaction --no-progress --no-scripts --no-autoloader
COPY backend/ ./
RUN rm -f .env \
    && mkdir -p bootstrap/cache storage/framework/cache/data storage/framework/sessions \
        storage/framework/views storage/logs storage/app/public \
    && composer dump-autoload --no-dev --optimize --no-interaction \
    && composer check-platform-reqs --no-dev

# ---------- 4. Image chạy ----------
FROM php-base AS production
ENV APP_ENV=production APP_DEBUG=false LOG_CHANNEL=stderr LOG_LEVEL=info \
    DB_CONNECTION=pgsql SESSION_DRIVER=database CACHE_STORE=database \
    QUEUE_CONNECTION=sync MAIL_MAILER=log PORT=10000 \
    RUN_MIGRATIONS=true RUN_SEEDERS=true

COPY --from=backend --chown=www-data:www-data /var/www /var/www
COPY --from=frontend --chown=www-data:www-data /app/.next/standalone /opt/frontend
COPY --from=frontend --chown=www-data:www-data /app/.next/static /opt/frontend/.next/static
COPY --from=frontend --chown=www-data:www-data /app/public /opt/frontend/public

COPY deploy/nginx.conf /etc/nginx/templates/default.conf.template
COPY backend/docker/php.ini /usr/local/etc/php/conf.d/zz-app.ini
COPY deploy/php-fpm.conf /usr/local/etc/php-fpm.d/zz-app.conf
COPY --chmod=755 deploy/entrypoint.sh /usr/local/bin/app-entrypoint

RUN mkdir -p /run/nginx && rm -f /etc/nginx/http.d/default.conf \
    && chmod -R ug+rwX /var/www/storage /var/www/bootstrap/cache

EXPOSE 10000
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
    CMD curl --fail --silent "http://127.0.0.1:${PORT}/up" > /dev/null || exit 1

ENTRYPOINT ["/sbin/tini", "--", "/usr/local/bin/app-entrypoint"]
