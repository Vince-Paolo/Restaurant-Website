FROM php:8.2-apache

# Enable PDO MySQL extension
RUN docker-php-ext-install pdo pdo_mysql

# Fix "More than one MPM loaded" — force prefork only
RUN a2dismod mpm_event mpm_worker 2>/dev/null; a2enmod mpm_prefork

# Copy app files into Apache's web root
COPY . /var/www/html/

# Use a startup script to substitute $PORT at runtime (build-time sed won't have PORT available)
RUN echo '#!/bin/bash\n\
sed -i "s/80/${PORT:-80}/g" /etc/apache2/ports.conf /etc/apache2/sites-enabled/000-default.conf\n\
apache2-foreground' > /usr/local/bin/start-apache.sh \
    && chmod +x /usr/local/bin/start-apache.sh

EXPOSE 80

CMD ["/usr/local/bin/start-apache.sh"]
