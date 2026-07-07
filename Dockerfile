FROM php:8.2-apache

# Enable PDO MySQL extension
RUN docker-php-ext-install pdo pdo_mysql


CMD ["/usr/local/bin/start-apache.sh"]
