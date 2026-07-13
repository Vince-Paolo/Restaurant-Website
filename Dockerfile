FROM php:8.3-apache

# Enable mod_rewrite / mod_headers so .htaccess rules (blocking .sql files,
# disabling directory listing) are actually honored.
RUN a2enmod rewrite headers

# This app talks to Postgres via PDO — install the pdo_pgsql driver.
# Also install the psql client so the entrypoint can auto-import the schema.
RUN apt-get update && apt-get install -y --no-install-recommends postgresql-client libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql \
    && rm -rf /var/lib/apt/lists/*

# Allow .htaccess overrides (Apache's default image sets AllowOverride None).
RUN sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' \
    /etc/apache2/apache2.conf

# Copy the app in.
COPY . /var/www/html/

# Apache/PHP need to own the files they serve.
RUN chown -R www-data:www-data /var/www/html

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["apache2-foreground"]
