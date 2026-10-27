FROM php:8.3-fpm-alpine

# Cài đặt các gói hệ thống cần thiết
RUN apk update && apk add --no-cache \
    nginx \
    supervisor \
    curl \
    git \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libzip-dev \
    zip \
    unzip \
    oniguruma-dev \
    icu-dev \
    autoconf \
    build-base \
    linux-headers \
    mysql-client

# Cài đặt extension PHP
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql \
        bcmath \
        mbstring \
        zip \
        gd \
        intl \
        opcache \
        fileinfo

# Cài đặt Redis extension
RUN pecl install redis \
    && docker-php-ext-enable redis

# Cài đặt Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Thiết lập thư mục làm việc
WORKDIR /var/www/backend

# Copy cấu hình PHP & OPcache
COPY ./docker/php/local.ini /usr/local/etc/php/conf.d/local.ini

# Copy mã nguồn backend
COPY ./backend /var/www/backend

# Cài đặt dependencies (bỏ qua dev trên production)
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Phân quyền thư mục lưu trữ & cache
RUN chown -R www-data:www-data /var/www/backend/storage /var/www/backend/bootstrap/cache \
    && chmod -R 775 /var/www/backend/storage /var/www/backend/bootstrap/cache

# Copy supervisor config
COPY ./docker/php/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 9000

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
