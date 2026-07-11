FROM php:8.3-apache

# Enable mod_rewrite / mod_headers so .htaccess rules (blocking .sql files,
# disabling directory listing) are actually honored.
RUN a2enmod rewrite headers

# This app talks to MySQL via PDO — install the pdo_mysql driver.
RUN docker-php-ext-install pdo pdo_mysql

# Allow .htaccess overrides (Apache's default image sets AllowOverride None).
RUN sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' \
    /etc/apache2/apache2.conf

# Copy the app in.
COPY . /var/www/html/

# Apache/PHP need to own the files they serve.
RUN chown -R www-data:www-data /var/www/html

EXPOSE 80
