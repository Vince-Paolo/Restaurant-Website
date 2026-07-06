-- ============================================================
-- migration_customer_auth.sql
-- Run AFTER restaurant_db.sql to add customer auth + fixes
-- mysql -u root -p restaurant_db < database/migration_customer_auth.sql
-- ============================================================

-- ------------------------------------------------------------
-- 1. Customers table (separate from admin users)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    full_name    VARCHAR(100) NOT NULL,
    email        VARCHAR(150) UNIQUE NOT NULL,
    phone        VARCHAR(30)  DEFAULT NULL,
    password     VARCHAR(255) NOT NULL,          -- bcrypt hash
    email_verified TINYINT(1) NOT NULL DEFAULT 0,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 2. CSRF tokens table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS csrf_tokens (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    token      VARCHAR(64) NOT NULL UNIQUE,
    context    VARCHAR(50) NOT NULL,             -- 'customer_login', 'register', 'reservation', etc.
    used       TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token (token)
);

-- ------------------------------------------------------------
-- 3. Customer login attempts (rate limiting)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS login_attempts (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    identifier VARCHAR(150) NOT NULL,            -- email or IP
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_identifier (identifier),
    INDEX idx_time (attempted_at)
);

-- ------------------------------------------------------------
-- 4. Add nullable customer_id FK to reservations
-- ------------------------------------------------------------
ALTER TABLE reservations
    ADD COLUMN IF NOT EXISTS customer_id INT DEFAULT NULL,
    ADD CONSTRAINT fk_reservation_customer
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

-- ------------------------------------------------------------
-- 5. Add nullable customer_id FK to orders
-- ------------------------------------------------------------
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS customer_id INT DEFAULT NULL,
    ADD CONSTRAINT fk_order_customer
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

-- ------------------------------------------------------------
-- 6. Force a password change for any admin still on the seeded
--    default credentials (existing installs that predate this
--    column all default to 0, so backfill the known default user).
-- ------------------------------------------------------------
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS must_change_password TINYINT(1) NOT NULL DEFAULT 0;

UPDATE users SET must_change_password = 1 WHERE username = 'admin';

-- ------------------------------------------------------------
-- 7. Fix the placeholder admin hash — UPDATE with a real hash!
--    Generate: php -r "echo password_hash('Admin@1234', PASSWORD_DEFAULT);"
--    Then replace the hash below with your output.
-- ------------------------------------------------------------
-- UPDATE users SET password = '$2y$12$REAL_HASH_HERE' WHERE username = 'admin';

-- Clean up expired CSRF tokens (can be run periodically)
-- DELETE FROM csrf_tokens WHERE created_at < NOW() - INTERVAL 1 HOUR;
