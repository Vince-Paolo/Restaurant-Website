FROM php:8.2-apache

# Enable PDO MySQL extension
RUN docker-php-ext-install pdo pdo_mysql

# Fix "More than one MPM loaded" — disable event/worker individually, enable prefork
RUN a2dismod mpm_event || true
RUN a2dismod mpm_worker || true
RUN a2enmod mpm_prefork || true

# Copy app files into Apache's web root
COPY . /var/www/html/

# Runtime startup script — substitutes $PORT at container start (not build time)
RUN echo '#!/bin/bash\n\
sed -i "s/80/${PORT:-80}/g" /etc/apache2/ports.conf /etc/apache2/sites-enabled/000-default.conf\n\
apache2-foreground' > /usr/local/bin/start-apache.sh \
    && chmod +x /usr/local/bin/start-apache.sh

EXPOSE 80
RUN ls -la /etc/apache2/mods-enabled/ | grep mpm
CMD ["/usr/local/bin/start-apache.sh"]
