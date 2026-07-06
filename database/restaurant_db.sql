-- ============================================================
-- restaurant_db.sql  —  Full schema + seed data
-- Run once: mysql -u root -p restaurant_db < database/restaurant_db.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS restaurant_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE restaurant_db;

-- ------------------------------------------------------------
-- Users (admin accounts)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50)  UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,          -- bcrypt hash
    role     VARCHAR(20)  NOT NULL DEFAULT 'admin',
    must_change_password TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Menu items
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS menu_items (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    price       DECIMAL(10,2) NOT NULL,
    category    VARCHAR(50)  NOT NULL,
    image_url   VARCHAR(500) DEFAULT NULL,
    is_available TINYINT(1)  NOT NULL DEFAULT 1,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Reservations
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reservations (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    name             VARCHAR(100) NOT NULL,
    email            VARCHAR(100) NOT NULL,
    phone            VARCHAR(30)  DEFAULT NULL,
    reservation_date DATE         NOT NULL,
    reservation_time TIME         NOT NULL,
    guests           INT          NOT NULL,
    special_requests TEXT         DEFAULT NULL,
    status           VARCHAR(20)  NOT NULL DEFAULT 'Pending',
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Orders
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(100)   NOT NULL,
    customer_email VARCHAR(100)  DEFAULT NULL,
    items         TEXT           NOT NULL,   -- JSON string of ordered items
    total_amount  DECIMAL(10,2)  NOT NULL,
    status        VARCHAR(20)    NOT NULL DEFAULT 'Pending',
    notes         TEXT           DEFAULT NULL,
    order_date    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Seed: default admin  (password: Admin@1234)
-- ⚠ SECURITY: this is a well-known placeholder credential. It is
--   flagged with must_change_password = 1 so the app FORCES a
--   password change on first login — do not remove that flag
--   without setting a real, unique password first.
-- Generate your own with: php -r "echo password_hash('Admin@1234', PASSWORD_DEFAULT);"
-- ------------------------------------------------------------
INSERT IGNORE INTO users (username, password, role, must_change_password) VALUES
('admin', '$2b$12$As3B7RxUJ1tAERC/BV5ENu7wjIbrBjGFfqlXUdyzrtZflrUH6r0Pa', 'admin', 1);

-- ------------------------------------------------------------
-- Seed: menu items
-- ------------------------------------------------------------
INSERT IGNORE INTO menu_items (name, description, price, category, image_url) VALUES
('Signature Pizza',    'Wood-fired perfection with fresh buffalo mozzarella, heirloom tomato, and fresh basil oil.',          15.99, 'pizza',   'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80&auto=format'),
('Quattro Formaggi',   'Four-cheese wood-fired pizza — mozzarella, gorgonzola dolce, fontina, and Parmigiano with rosemary.', 17.99, 'pizza',   'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80&auto=format'),
('Truffle Fettuccine', 'Creamy black truffle sauce tossed with fresh handmade fettuccine and aged Parmigiano Reggiano.',      18.99, 'pasta',   'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&q=80&auto=format'),
('Classic Carbonara',  'Free-range eggs, crispy pancetta, fresh black pepper, and aged Pecorino Romano.',                    16.99, 'pasta',   'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=600&q=80&auto=format'),
('Premium Ribeye',     '28-day dry-aged ribeye grilled to your liking, served with asparagus and house-made béarnaise.',     32.99, 'steak',   'https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=600&q=80&auto=format'),
('Chocolate Lava Cake','Warm Valrhona chocolate center, Madagascar vanilla bean ice cream, and cocoa dust.',                  8.99,  'dessert', 'https://images.unsplash.com/photo-1579306194872-64d3b7bac4c2?w=600&q=80&auto=format'),
('Classic Tiramisù',   'Espresso-soaked Savoiardi, whipped mascarpone, Marsala wine, dusted with Valrhona cocoa.',           9.99,  'dessert', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80&auto=format'),
('Ember Negroni',      'House-infused smoked gin, Campari, and smoked rosso vermouth, stirred over a large ice sphere.',    12.99, 'drinks',  'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&q=80&auto=format');
