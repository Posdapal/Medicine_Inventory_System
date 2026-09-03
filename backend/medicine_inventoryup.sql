-- ============================================================================
-- medicine_inventory.sql
-- MySQL / MariaDB schema for the Medicine Inventory System (Products / Suppliers /
-- Stock Management / Expiry Management) frontend, built from the ERD:
-- SYSTEM_SETTINGS, CATEGORIES, UNITS, PRODUCTS, PRODUCT_BATCHES, SUPPLIERS,
-- STOCK_TRANSACTIONS, STOCK_TRANSACTION_ITEMS, STOCK_MOVEMENTS,
-- NOTIFICATIONS, USERS, ROLES, REPORTS, USER_PERMISSIONS.

CREATE DATABASE IF NOT EXISTS `medicine_inventoryup`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `medicine_inventoryup`;

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- ROLES
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name`        VARCHAR(50)  NOT NULL,
  `description` VARCHAR(255) NULL,
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_roles_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- USERS
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `role_id`     INT UNSIGNED NOT NULL,
  `full_name`   VARCHAR(150) NOT NULL,
  `username`    VARCHAR(100) NOT NULL,
  `email`       VARCHAR(150) NULL,
  `password`    VARCHAR(255) NOT NULL COMMENT 'store a bcrypt/argon2 hash, never plaintext',
  `status`      ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `must_change_password` TINYINT(1) NOT NULL DEFAULT 0 AFTER `status`;
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_users_username` (`username`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `idx_users_role_id` (`role_id`),
  CONSTRAINT `fk_users_role`
    FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- USER_PERMISSIONS  (per-user, per-module action overrides)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `user_permissions`;
CREATE TABLE `user_permissions` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id`     INT UNSIGNED NOT NULL,
  `module`      ENUM('products','suppliers','categories','stock','reports') NOT NULL,
  `can_create`  TINYINT(1) NOT NULL DEFAULT 0,
  `can_read`    TINYINT(1) NOT NULL DEFAULT 0,
  `can_update`  TINYINT(1) NOT NULL DEFAULT 0,
  `can_delete`  TINYINT(1) NOT NULL DEFAULT 0,
  `can_export`  TINYINT(1) NOT NULL DEFAULT 0,
  `can_import`  TINYINT(1) NOT NULL DEFAULT 0,
  `can_download_template` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_user_module` (`user_id`, `module`),
  KEY `idx_permissions_user_id` (`user_id`),
  CONSTRAINT `fk_permissions_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- SYSTEM_SETTINGS
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `system_settings`;
CREATE TABLE `system_settings` (
  `id`            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `setting_key`   VARCHAR(100) NOT NULL,
  `setting_value` TEXT         NULL,
  `description`   VARCHAR(255) NULL,
  `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_settings_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- CATEGORIES
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name`        VARCHAR(150) NOT NULL,
  `description` VARCHAR(255) NULL,
  `status`      ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_categories_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- UNITS
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `units`;
CREATE TABLE `units` (
  `id`           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name`         VARCHAR(100) NOT NULL,
  `abbreviation` VARCHAR(20)  NULL,
  `created_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_units_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- PRODUCTS
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `category_id`    INT UNSIGNED NULL,
  `unit_id`        INT UNSIGNED NULL,
  `product_code`   VARCHAR(50)  NOT NULL,
  `product_name`   VARCHAR(200) NOT NULL,
  `generic_name`   VARCHAR(200) NULL,
  `minimum_stock`  INT UNSIGNED NOT NULL DEFAULT 0,
  `status`         ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `created_at`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_products_code` (`product_code`),
  KEY `idx_products_category_id` (`category_id`),
  KEY `idx_products_unit_id` (`unit_id`),
  CONSTRAINT `fk_products_category`
    FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_products_unit`
    FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- SUPPLIERS
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `suppliers`;
CREATE TABLE `suppliers` (
  `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `supplier_code`  VARCHAR(50)  NOT NULL,
  `supplier_name`  VARCHAR(200) NOT NULL,
  `contact_name`   VARCHAR(150) NULL,
  `phone`          VARCHAR(30)  NULL,
  `email`          VARCHAR(150) NULL,
  `address`        VARCHAR(255) NULL,
  `status`         ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `created_at`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_suppliers_code` (`supplier_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- PRODUCT_BATCHES
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `product_batches`;
CREATE TABLE `product_batches` (
  `id`                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `product_id`          INT UNSIGNED NOT NULL,
  `batch_number`        VARCHAR(100) NOT NULL,
  `manufacture_date`    DATE NULL,
  `expiry_date`         DATE NULL,
  `received_quantity`   INT UNSIGNED NOT NULL DEFAULT 0,
  `available_quantity`  INT UNSIGNED NOT NULL DEFAULT 0,
  `purchase_price`      DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `status`              ENUM('active','depleted','expired') NOT NULL DEFAULT 'active',
  `created_at`          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_batches_product_batch` (`product_id`, `batch_number`),
  KEY `idx_batches_product_id` (`product_id`),
  KEY `idx_batches_expiry_date` (`expiry_date`),
  CONSTRAINT `fk_batches_product`
    FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- STOCK_TRANSACTIONS  (header row for a Stock In or Stock Out event)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `stock_transactions`;
CREATE TABLE `stock_transactions` (
  `id`                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `supplier_id`         INT UNSIGNED NULL COMMENT 'set for Stock In transactions',
  `created_by`          INT UNSIGNED NULL,
  `transaction_number`  VARCHAR(50)  NOT NULL,
  `transaction_type`    ENUM('stock_in','stock_out') NOT NULL,
  `transaction_date`    DATE NOT NULL,
  `reference_number`    VARCHAR(100) NULL,
  `reason`              VARCHAR(255) NULL COMMENT 'used for stock_out: Sale, Damaged, Expired, Internal Use, Other',
  `status`              ENUM('draft','completed','cancelled') NOT NULL DEFAULT 'completed',
  `created_at`          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_transactions_number` (`transaction_number`),
  KEY `idx_transactions_supplier_id` (`supplier_id`),
  KEY `idx_transactions_created_by` (`created_by`),
  KEY `idx_transactions_type_date` (`transaction_type`, `transaction_date`),
  CONSTRAINT `fk_transactions_supplier`
    FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_transactions_user`
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- STOCK_TRANSACTION_ITEMS  (line items of a stock_transactions row)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `stock_transaction_items`;
CREATE TABLE `stock_transaction_items` (
  `id`                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `stock_transaction_id`  INT UNSIGNED NOT NULL,
  `product_id`            INT UNSIGNED NOT NULL,
  `batch_id`               INT UNSIGNED NOT NULL,
  `quantity`               INT UNSIGNED NOT NULL,
  `unit_price`             DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `created_at`             TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_items_transaction_id` (`stock_transaction_id`),
  KEY `idx_items_product_id` (`product_id`),
  KEY `idx_items_batch_id` (`batch_id`),
  CONSTRAINT `fk_items_transaction`
    FOREIGN KEY (`stock_transaction_id`) REFERENCES `stock_transactions` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_items_product`
    FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_items_batch`
    FOREIGN KEY (`batch_id`) REFERENCES `product_batches` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- STOCK_MOVEMENTS  (immutable audit trail: one row per quantity change)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `stock_movements`;
CREATE TABLE `stock_movements` (
  `id`                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `product_id`          INT UNSIGNED NOT NULL,
  `batch_id`            INT UNSIGNED NOT NULL,
  `transaction_id`      INT UNSIGNED NULL,
  `created_by`          INT UNSIGNED NULL,
  `movement_type`       ENUM('stock_in','stock_out','adjustment') NOT NULL,
  `quantity_before`     INT NOT NULL,
  `movement_quantity`   INT NOT NULL,
  `quantity_after`      INT NOT NULL,
  `created_at`          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_movements_product_id` (`product_id`),
  KEY `idx_movements_batch_id` (`batch_id`),
  KEY `idx_movements_transaction_id` (`transaction_id`),
  KEY `idx_movements_created_by` (`created_by`),
  KEY `idx_movements_created_at` (`created_at`),
  CONSTRAINT `fk_movements_product`
    FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_movements_batch`
    FOREIGN KEY (`batch_id`) REFERENCES `product_batches` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_movements_transaction`
    FOREIGN KEY (`transaction_id`) REFERENCES `stock_transactions` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_movements_user`
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- NOTIFICATIONS  (low stock / near expiry / expired alerts)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id`                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `product_id`         INT UNSIGNED NULL,
  `batch_id`           INT UNSIGNED NULL,
  `notification_type`  ENUM('low_stock','near_expiry','expired','other') NOT NULL DEFAULT 'other',
  `title`              VARCHAR(200) NOT NULL,
  `message`            TEXT NULL,
  `is_read`            TINYINT(1) NOT NULL DEFAULT 0,
  `created_at`         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_notifications_product_id` (`product_id`),
  KEY `idx_notifications_batch_id` (`batch_id`),
  KEY `idx_notifications_is_read` (`is_read`),
  CONSTRAINT `fk_notifications_product`
    FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_notifications_batch`
    FOREIGN KEY (`batch_id`) REFERENCES `product_batches` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- REPORTS  (saved report snapshots — powers GET/POST /api/reports)
-- Not part of the original ERD; added to support the Reports page, which
-- lets a user generate a report on the fly (report_type + optional date
-- range) and optionally save the resulting rows as a named snapshot to
-- revisit later. `data_snapshot` matches the column name used by
-- reportsController.js's INSERT statement.
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `reports`;
CREATE TABLE `reports` (
  `id`               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title`            VARCHAR(200) NOT NULL,
  `report_type`      ENUM('inventory','stock_in','stock_out','stock_movement','low_stock','near_expiry') NOT NULL,
  `date_range_start` DATE NULL,
  `date_range_end`   DATE NULL,
  `generated_by`     INT UNSIGNED NULL,
  `data_snapshot`    JSON NULL COMMENT 'the generated report rows, cached for later viewing',
  `created_at`       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_reports_generated_by` (`generated_by`),
  KEY `idx_reports_type` (`report_type`),
  CONSTRAINT `fk_reports_user`
    FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;


-- ============================================================================
-- SEED DATA — enough to log in and see non-empty pages immediately.
-- Replace/remove before going to production.
-- ============================================================================

INSERT INTO `roles` (`name`, `description`) VALUES
  ('Administrator', 'Full access to all modules'),
  ('Pharmacist', 'Dispensing and inventory visibility'),
  ('Stock Staff', 'Receiving and stock operations');

-- Default login: email "admin@clinic.local", password "admin123"
-- (this is a REAL bcrypt hash of "admin123", verified to work with
-- bcryptjs.compare() in the Node/Express backend — change it immediately
-- after your first login in any environment beyond local testing)
INSERT INTO `users` (`role_id`, `full_name`, `username`, `email`, `password`, `status`) VALUES
  (1, 'Admin User', 'admin', 'admin123@gmail.com',
   '$2b$10$VqS.Rio.P2w/DK0kFXP5seo5rP/jSPraEcutODBPfRHOli317zak2', 'active');

-- Administrator gets full CRUD on every module by default.
INSERT INTO `user_permissions`
  (`user_id`, `module`, `can_create`, `can_read`, `can_update`, `can_delete`, `can_export`, `can_import`, `can_download_template`) VALUES
  (1, 'products',   1, 1, 1, 1, 1, 1, 1),
  (1, 'suppliers',  1, 1, 1, 1, 1, 1, 1),
  (1, 'categories', 1, 1, 1, 1, 1, 1, 1),
  (1, 'stock',      1, 1, 1, 1, 1, 1, 1),
  (1, 'reports',    1, 1, 1, 1, 1, 1, 1);

INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`) VALUES
  ('clinic_name', 'City Clinic', 'Displayed in the app header and printed reports'),
  ('low_stock_threshold_days', '7', 'Days of stock remaining considered "low"'),
  ('near_expiry_threshold_days', '30', 'Days before expiry considered "near expiry"');

INSERT INTO `categories` (`name`, `description`, `status`) VALUES
  ('Surgical Equipment', 'Instruments & tools', 'active'),
  ('PPE & Safety', 'Protective equipment', 'active'),
  ('Diagnostics', 'Testing & measurement', 'active'),
  ('Consumables', 'Single-use supplies', 'active');

INSERT INTO `units` (`name`, `abbreviation`) VALUES
  ('Box', 'box'),
  ('Bottle', 'btl'),
  ('Piece', 'pc'),
  ('Pack', 'pk');

INSERT INTO `products` (`category_id`, `unit_id`, `product_code`, `product_name`, `generic_name`, `minimum_stock`, `status`) VALUES
  (2, 1, 'SG-100',  'Surgical Gloves (L)',     'Latex Gloves',       100, 'active'),
  (3, 3, 'DT-220',  'Digital Thermometer',     NULL,                  50, 'active'),
  (2, 4, 'N95-500', 'N95 Respirator Mask',     'Respirator',          60, 'active'),
  (4, 3, 'SY-050',  'Syringe 5ml',             'Disposable Syringe', 200, 'active'),
  (1, 3, 'SS-310',  'Surgical Scissors',       NULL,                  20, 'active');

INSERT INTO `suppliers` (`supplier_code`, `supplier_name`, `contact_name`, `phone`, `email`, `address`, `status`) VALUES
  ('SUP-100', 'MedSupply Co.',   'Sarah Lee',     '555-0142', 'sarah@medsupply.com',  '12 Harbor Rd',      'active'),
  ('SUP-101', 'HealthTech Ltd.', 'James Otieno',  '555-0198', 'james@healthtech.com', '88 Innovation Ave', 'active'),
  ('SUP-102', 'PharmaLine',      'Maria Chen',    '555-0233', 'maria@pharmaline.com', '5 Market St',       'inactive'),
  ('SUP-103', 'SteelMed Inc.',   'David Kim',     '555-0176', 'david@steelmed.com',   '200 Foundry Ln',    'active');

INSERT INTO `product_batches` (`product_id`, `batch_number`, `manufacture_date`, `expiry_date`, `received_quantity`, `available_quantity`, `purchase_price`, `status`) VALUES
  (1, 'BX-2201',  '2026-01-10', '2027-03-01', 200, 420, 11.20, 'active'),
  (2, 'DT-0099',  '2025-11-05', NULL,          50,  85, 21.00, 'active'),
  (3, 'N95-9081', '2025-09-01', '2026-08-15',  52,  12,  3.20, 'active'),
  (4, 'SY-6620',  '2025-10-12', '2027-02-01', 200,   0,  0.40, 'depleted'),
  (5, 'SS-4410',  '2025-06-01', NULL,          64,  64, 15.50, 'active');

INSERT INTO `stock_transactions` (`supplier_id`, `created_by`, `transaction_number`, `transaction_type`, `transaction_date`, `reference_number`, `reason`, `status`) VALUES
  (1, 1, 'STI-0001', 'stock_in',  '2026-07-20', 'PO-4471', NULL,           'completed'),
  (2, 1, 'STI-0002', 'stock_in',  '2026-07-22', 'PO-4482', NULL,           'completed'),
  (NULL, 1, 'STO-0001', 'stock_out', '2026-07-24', 'INV-8821', 'Sale',         'completed'),
  (NULL, 1, 'STO-0002', 'stock_out', '2026-07-25', NULL,      'Internal Use', 'completed');

INSERT INTO `stock_transaction_items` (`stock_transaction_id`, `product_id`, `batch_id`, `quantity`, `unit_price`) VALUES
  (1, 1, 1, 200, 11.20),
  (2, 2, 2,  50, 21.00),
  (3, 3, 3,  40,  3.20),
  (4, 4, 4, 200,  0.40);

INSERT INTO `stock_movements` (`product_id`, `batch_id`, `transaction_id`, `created_by`, `movement_type`, `quantity_before`, `movement_quantity`, `quantity_after`) VALUES
  (1, 1, 1, 1, 'stock_in',  220, 200, 420),
  (2, 2, 2, 1, 'stock_in',   35,  50,  85),
  (3, 3, 3, 1, 'stock_out',  52,  40,  12),
  (4, 4, 4, 1, 'stock_out', 200, 200,   0);

INSERT INTO `notifications` (`product_id`, `batch_id`, `notification_type`, `title`, `message`, `is_read`) VALUES
  (3, 3, 'low_stock',   'Low stock: N95 Respirator Mask', 'Available quantity (12) is below the minimum stock level (60).', 0),
  (3, 3, 'near_expiry',  'Batch N95-9081 nearing expiry',  'Expires 2026-08-15.', 0),
  (4, 4, 'low_stock',   'Out of stock: Syringe 5ml',      'Available quantity is 0.', 0);


-- ============================================================================
-- HELPER VIEWS
-- These match the shapes the frontend already expects from the API, so your
-- backend controllers can often just `SELECT * FROM v_...` with a WHERE/LIMIT.
-- ============================================================================

-- Powers: GET /products  (product_code, product_name, generic_name,
-- category_name, unit_name, available_quantity, minimum_stock, status)
CREATE OR REPLACE VIEW `v_products` AS
SELECT
  p.id,
  p.product_code,
  p.product_name,
  p.generic_name,
  c.name AS category_name,
  u.name AS unit_name,
  u.abbreviation AS unit_abbreviation,
  COALESCE(SUM(pb.available_quantity), 0) AS available_quantity,
  p.minimum_stock,
  p.status
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
LEFT JOIN units u ON u.id = p.unit_id
LEFT JOIN product_batches pb ON pb.product_id = p.id AND pb.status = 'active'
GROUP BY p.id, p.product_code, p.product_name, p.generic_name, c.name, u.name, u.abbreviation, p.minimum_stock, p.status;

-- Powers: GET /stock/current
CREATE OR REPLACE VIEW `v_current_stock` AS
SELECT
  p.product_code,
  p.product_name,
  c.name AS category,
  u.name AS unit,
  COALESCE(SUM(pb.available_quantity), 0) AS available_quantity,
  p.minimum_stock
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
LEFT JOIN units u ON u.id = p.unit_id
LEFT JOIN product_batches pb ON pb.product_id = p.id AND pb.status = 'active'
GROUP BY p.id, p.product_code, p.product_name, c.name, u.name, p.minimum_stock;

-- Powers: GET /expiry/near  (batches expiring within the next 30 days)
CREATE OR REPLACE VIEW `v_near_expiry` AS
SELECT
  p.product_name AS product,
  pb.batch_number,
  pb.manufacture_date,
  pb.expiry_date,
  DATEDIFF(pb.expiry_date, CURDATE()) AS days_remaining,
  pb.available_quantity
FROM product_batches pb
JOIN products p ON p.id = pb.product_id
WHERE pb.expiry_date IS NOT NULL
  AND p.status = 'active'
  AND pb.status = 'active'
  AND pb.expiry_date >= CURDATE()
  AND pb.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
  AND pb.available_quantity > 0
ORDER BY pb.expiry_date ASC;

-- Powers: GET /expiry/expired
CREATE OR REPLACE VIEW `v_expired_products` AS
SELECT
  p.product_name AS product,
  pb.batch_number,
  pb.manufacture_date,
  pb.expiry_date,
  DATEDIFF(CURDATE(), pb.expiry_date) AS days_expired,
  pb.available_quantity
FROM product_batches pb
JOIN products p ON p.id = pb.product_id
WHERE pb.expiry_date IS NOT NULL
  AND p.status = 'active'
  AND pb.status = 'active'
  AND pb.available_quantity > 0
  AND pb.expiry_date < CURDATE()
ORDER BY pb.expiry_date DESC;

-- Powers: GET /stock/history
CREATE OR REPLACE VIEW `v_stock_history` AS
SELECT
  p.product_name AS product,
  pb.batch_number,
  sm.movement_type,
  sm.quantity_before,
  sm.movement_quantity,
  sm.quantity_after,
  DATE(sm.created_at) AS date
FROM stock_movements sm
JOIN products p ON p.id = sm.product_id
JOIN product_batches pb ON pb.id = sm.batch_id
ORDER BY sm.created_at DESC;

-- Powers: GET /dashboard/summary  (single-row aggregate)
CREATE OR REPLACE VIEW `v_dashboard_summary` AS
SELECT
  (SELECT COUNT(*) FROM products WHERE status = 'active') AS total_products,
  (SELECT COALESCE(SUM(available_quantity), 0) FROM product_batches WHERE status = 'active') AS total_stock,
  (SELECT COUNT(*) FROM v_current_stock WHERE available_quantity > 0 AND available_quantity <= minimum_stock) AS low_stock,
  (SELECT COUNT(*) FROM v_current_stock WHERE available_quantity = 0) AS out_of_stock,
  (SELECT COALESCE(SUM(sti.quantity), 0)
     FROM stock_transactions st
     JOIN stock_transaction_items sti ON sti.stock_transaction_id = st.id
     WHERE st.transaction_type = 'stock_in' AND st.transaction_date = CURDATE()) AS stock_in_today,
  (SELECT COALESCE(SUM(sti.quantity), 0)
     FROM stock_transactions st
     JOIN stock_transaction_items sti ON sti.stock_transaction_id = st.id
     WHERE st.transaction_type = 'stock_out' AND st.transaction_date = CURDATE()) AS stock_out_today,
  (SELECT COUNT(*) FROM v_near_expiry) AS near_expiry,
  (SELECT COUNT(*) FROM v_expired_products) AS expired_products,
  (SELECT COUNT(*) FROM suppliers WHERE status = 'active') AS total_suppliers,
  (SELECT COUNT(*) FROM categories WHERE status = 'active') AS total_categories,
  (SELECT COUNT(*) FROM users WHERE status = 'active') AS total_users;



-- ============================================================================
-- medicine_inventory.sql  (FIXED)
-- MySQL / MariaDB schema for the Medicine Inventory System.
--
-- Fixes applied vs. the original file:
--   1. `users` table had a syntax error: `AFTER `status`` is ALTER TABLE
--      syntax and is invalid inside CREATE TABLE, and the stray trailing
--      `;` terminated the statement early, corrupting everything after it
--      (created_at/updated_at columns and all keys were dropped).
--   2. The application code (roles.js, permissions.js, auth middleware)
--      uses ROLE-based permissions: it queries a `role_permissions` table
--      keyed by (role_id, module) with columns can_create, can_read,
--      can_update, can_delete, can_export, can_import, can_print.
--      That table did not exist in the schema at all — only the older,
--      per-USER `user_permissions` table was defined (different shape,
--      no can_print column, narrower module ENUM). This is what produced:
--        Error: Table 'medicine_inventoryup.role_permissions' doesn't exist
--      `role_permissions` has been added below, matching config/permissions.js
--      exactly (MODULES list + can_print), and seeded for the three roles.
--      `user_permissions` is left in place (harmless/unused by current code)
--      in case you still want per-user overrides later; delete it if not.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `medicine_inventoryup`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `medicine_inventoryup`;

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- ROLES
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name`        VARCHAR(50)  NOT NULL,
  `description` VARCHAR(255) NULL,
  `status`      ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_roles_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- USERS  (fixed: removed invalid `AFTER` clause / stray semicolon)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `role_id`     INT UNSIGNED NOT NULL,
  `full_name`   VARCHAR(150) NOT NULL,
  `username`    VARCHAR(100) NOT NULL,
  `email`       VARCHAR(150) NULL,
  `password`    VARCHAR(255) NOT NULL COMMENT 'store a bcrypt/argon2 hash, never plaintext',
  `status`      ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `must_change_password` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_users_username` (`username`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `idx_users_role_id` (`role_id`),
  CONSTRAINT `fk_users_role`
    FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- ROLE_PERMISSIONS  (NEW — this is the table your app code actually queries:
-- roles.js, permissions.js controllers and the checkPermission() middleware
-- all join roles -> role_permissions on (role_id, module).)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `role_permissions`;
CREATE TABLE `role_permissions` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `role_id`     INT UNSIGNED NOT NULL,
  `module`      ENUM(
                  'dashboard','products','categories','units','suppliers',
                  'stock_in','stock_out','current_stock','stock_history',
                  'expiry','reports','users','roles','settings','stock'
                ) NOT NULL,
  `can_create`  TINYINT(1) NOT NULL DEFAULT 0,
  `can_read`    TINYINT(1) NOT NULL DEFAULT 0,
  `can_update`  TINYINT(1) NOT NULL DEFAULT 0,
  `can_delete`  TINYINT(1) NOT NULL DEFAULT 0,
  `can_export`  TINYINT(1) NOT NULL DEFAULT 0,
  `can_import`  TINYINT(1) NOT NULL DEFAULT 0,
  `can_print`   TINYINT(1) NOT NULL DEFAULT 0,
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_role_module` (`role_id`, `module`),
  KEY `idx_role_permissions_role_id` (`role_id`),
  CONSTRAINT `fk_role_permissions_role`
    FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- USER_PERMISSIONS  (kept for backward compatibility; not used by the
-- current controllers, which use role_permissions instead. Safe to drop
-- if you don't plan to support per-user overrides.)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `user_permissions`;
CREATE TABLE `user_permissions` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id`     INT UNSIGNED NOT NULL,
  `module`      ENUM('products','suppliers','categories','stock','reports') NOT NULL,
  `can_create`  TINYINT(1) NOT NULL DEFAULT 0,
  `can_read`    TINYINT(1) NOT NULL DEFAULT 0,
  `can_update`  TINYINT(1) NOT NULL DEFAULT 0,
  `can_delete`  TINYINT(1) NOT NULL DEFAULT 0,
  `can_export`  TINYINT(1) NOT NULL DEFAULT 0,
  `can_import`  TINYINT(1) NOT NULL DEFAULT 0,
  `can_download_template` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_user_module` (`user_id`, `module`),
  KEY `idx_permissions_user_id` (`user_id`),
  CONSTRAINT `fk_permissions_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- SYSTEM_SETTINGS
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `system_settings`;
CREATE TABLE `system_settings` (
  `id`            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `setting_key`   VARCHAR(100) NOT NULL,
  `setting_value` TEXT         NULL,
  `description`   VARCHAR(255) NULL,
  `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_settings_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- CATEGORIES
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name`        VARCHAR(150) NOT NULL,
  `description` VARCHAR(255) NULL,
  `status`      ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_categories_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- UNITS
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `units`;
CREATE TABLE `units` (
  `id`           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name`         VARCHAR(100) NOT NULL,
  `abbreviation` VARCHAR(20)  NULL,
  `created_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_units_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- PRODUCTS
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `category_id`    INT UNSIGNED NULL,
  `unit_id`        INT UNSIGNED NULL,
  `product_code`   VARCHAR(50)  NOT NULL,
  `product_name`   VARCHAR(200) NOT NULL,
  `generic_name`   VARCHAR(200) NULL,
  `minimum_stock`  INT UNSIGNED NOT NULL DEFAULT 0,
  `status`         ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `created_at`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_products_code` (`product_code`),
  KEY `idx_products_category_id` (`category_id`),
  KEY `idx_products_unit_id` (`unit_id`),
  CONSTRAINT `fk_products_category`
    FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_products_unit`
    FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- SUPPLIERS
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `suppliers`;
CREATE TABLE `suppliers` (
  `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `supplier_code`  VARCHAR(50)  NOT NULL,
  `supplier_name`  VARCHAR(200) NOT NULL,
  `contact_name`   VARCHAR(150) NULL,
  `phone`          VARCHAR(30)  NULL,
  `email`          VARCHAR(150) NULL,
  `address`        VARCHAR(255) NULL,
  `status`         ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `created_at`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_suppliers_code` (`supplier_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- PRODUCT_BATCHES
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `product_batches`;
CREATE TABLE `product_batches` (
  `id`                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `product_id`          INT UNSIGNED NOT NULL,
  `batch_number`        VARCHAR(100) NOT NULL,
  `manufacture_date`    DATE NULL,
  `expiry_date`         DATE NULL,
  `received_quantity`   INT UNSIGNED NOT NULL DEFAULT 0,
  `available_quantity`  INT UNSIGNED NOT NULL DEFAULT 0,
  `purchase_price`      DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `status`              ENUM('active','depleted','expired') NOT NULL DEFAULT 'active',
  `created_at`          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_batches_product_batch` (`product_id`, `batch_number`),
  KEY `idx_batches_product_id` (`product_id`),
  KEY `idx_batches_expiry_date` (`expiry_date`),
  CONSTRAINT `fk_batches_product`
    FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- STOCK_TRANSACTIONS
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `stock_transactions`;
CREATE TABLE `stock_transactions` (
  `id`                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `supplier_id`         INT UNSIGNED NULL COMMENT 'set for Stock In transactions',
  `created_by`          INT UNSIGNED NULL,
  `transaction_number`  VARCHAR(50)  NOT NULL,
  `transaction_type`    ENUM('stock_in','stock_out') NOT NULL,
  `transaction_date`    DATE NOT NULL,
  `reference_number`    VARCHAR(100) NULL,
  `reason`              VARCHAR(255) NULL COMMENT 'used for stock_out: Sale, Damaged, Expired, Internal Use, Other',
  `status`              ENUM('draft','completed','cancelled') NOT NULL DEFAULT 'completed',
  `created_at`          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_transactions_number` (`transaction_number`),
  KEY `idx_transactions_supplier_id` (`supplier_id`),
  KEY `idx_transactions_created_by` (`created_by`),
  KEY `idx_transactions_type_date` (`transaction_type`, `transaction_date`),
  CONSTRAINT `fk_transactions_supplier`
    FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_transactions_user`
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- STOCK_TRANSACTION_ITEMS
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `stock_transaction_items`;
CREATE TABLE `stock_transaction_items` (
  `id`                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `stock_transaction_id`  INT UNSIGNED NOT NULL,
  `product_id`            INT UNSIGNED NOT NULL,
  `batch_id`               INT UNSIGNED NOT NULL,
  `quantity`               INT UNSIGNED NOT NULL,
  `unit_price`             DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `created_at`             TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_items_transaction_id` (`stock_transaction_id`),
  KEY `idx_items_product_id` (`product_id`),
  KEY `idx_items_batch_id` (`batch_id`),
  CONSTRAINT `fk_items_transaction`
    FOREIGN KEY (`stock_transaction_id`) REFERENCES `stock_transactions` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_items_product`
    FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_items_batch`
    FOREIGN KEY (`batch_id`) REFERENCES `product_batches` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- STOCK_MOVEMENTS
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `stock_movements`;
CREATE TABLE `stock_movements` (
  `id`                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `product_id`          INT UNSIGNED NOT NULL,
  `batch_id`            INT UNSIGNED NOT NULL,
  `transaction_id`      INT UNSIGNED NULL,
  `created_by`          INT UNSIGNED NULL,
  `movement_type`       ENUM('stock_in','stock_out','adjustment') NOT NULL,
  `quantity_before`     INT NOT NULL,
  `movement_quantity`   INT NOT NULL,
  `quantity_after`      INT NOT NULL,
  `created_at`          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_movements_product_id` (`product_id`),
  KEY `idx_movements_batch_id` (`batch_id`),
  KEY `idx_movements_transaction_id` (`transaction_id`),
  KEY `idx_movements_created_by` (`created_by`),
  KEY `idx_movements_created_at` (`created_at`),
  CONSTRAINT `fk_movements_product`
    FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_movements_batch`
    FOREIGN KEY (`batch_id`) REFERENCES `product_batches` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_movements_transaction`
    FOREIGN KEY (`transaction_id`) REFERENCES `stock_transactions` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_movements_user`
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- NOTIFICATIONS
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id`                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `product_id`         INT UNSIGNED NULL,
  `batch_id`           INT UNSIGNED NULL,
  `notification_type`  ENUM('low_stock','near_expiry','expired','other') NOT NULL DEFAULT 'other',
  `title`              VARCHAR(200) NOT NULL,
  `message`            TEXT NULL,
  `is_read`            TINYINT(1) NOT NULL DEFAULT 0,
  `created_at`         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_notifications_product_id` (`product_id`),
  KEY `idx_notifications_batch_id` (`batch_id`),
  KEY `idx_notifications_is_read` (`is_read`),
  CONSTRAINT `fk_notifications_product`
    FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_notifications_batch`
    FOREIGN KEY (`batch_id`) REFERENCES `product_batches` (`id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- REPORTS
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `reports`;
CREATE TABLE `reports` (
  `id`               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title`            VARCHAR(200) NOT NULL,
  `report_type`      ENUM('inventory','stock_in','stock_out','stock_movement','low_stock','near_expiry') NOT NULL,
  `date_range_start` DATE NULL,
  `date_range_end`   DATE NULL,
  `generated_by`     INT UNSIGNED NULL,
  `data_snapshot`    JSON NULL COMMENT 'the generated report rows, cached for later viewing',
  `created_at`       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_reports_generated_by` (`generated_by`),
  KEY `idx_reports_type` (`report_type`),
  CONSTRAINT `fk_reports_user`
    FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;


-- ============================================================================
-- SEED DATA
-- ============================================================================

INSERT INTO `roles` (`name`, `description`, `status`) VALUES
  ('Administrator', 'Full access to all modules', 'active'),
  ('Pharmacist', 'Dispensing and inventory visibility', 'active'),
  ('Stock Staff', 'Receiving and stock operations', 'active');

-- Default login: email "admin123@gmail.com", password "admin123"
INSERT INTO `users` (`role_id`, `full_name`, `username`, `email`, `password`, `status`) VALUES
  (1, 'Admin User', 'admin', 'admin123@gmail.com',
   '$2b$10$VqS.Rio.P2w/DK0kFXP5seo5rP/jSPraEcutODBPfRHOli317zak2', 'active');

-- Administrator: full CRUD on every module (checkPermission() bypasses this
-- for admins in code, but it's seeded anyway for consistency/reporting).
INSERT INTO `role_permissions`
  (`role_id`, `module`, `can_create`, `can_read`, `can_update`, `can_delete`, `can_export`, `can_import`, `can_print`)
SELECT 1, m, 1, 1, 1, 1, 1, 1, 1
FROM (
  SELECT 'dashboard' AS m UNION ALL SELECT 'products' UNION ALL SELECT 'categories'
  UNION ALL SELECT 'units' UNION ALL SELECT 'suppliers' UNION ALL SELECT 'stock_in'
  UNION ALL SELECT 'stock_out' UNION ALL SELECT 'current_stock' UNION ALL SELECT 'stock_history'
  UNION ALL SELECT 'expiry' UNION ALL SELECT 'reports' UNION ALL SELECT 'users'
  UNION ALL SELECT 'roles' UNION ALL SELECT 'settings' UNION ALL SELECT 'stock'
) modules;

-- Pharmacist: read-only across most modules, no user/role management.
INSERT INTO `role_permissions`
  (`role_id`, `module`, `can_create`, `can_read`, `can_update`, `can_delete`, `can_export`, `can_import`, `can_print`) VALUES
  (2, 'dashboard',      0, 1, 0, 0, 0, 0, 0),
  (2, 'products',       0, 1, 0, 0, 1, 0, 1),
  (2, 'current_stock',  0, 1, 0, 0, 1, 0, 1),
  (2, 'expiry',         0, 1, 0, 0, 1, 0, 1),
  (2, 'reports',        0, 1, 0, 0, 1, 0, 1);

-- Stock Staff: can operate stock in/out and view products, no admin modules.
INSERT INTO `role_permissions`
  (`role_id`, `module`, `can_create`, `can_read`, `can_update`, `can_delete`, `can_export`, `can_import`, `can_print`) VALUES
  (3, 'dashboard',      0, 1, 0, 0, 0, 0, 0),
  (3, 'products',       0, 1, 0, 0, 0, 0, 0),
  (3, 'stock_in',       1, 1, 1, 0, 1, 1, 1),
  (3, 'stock_out',      1, 1, 1, 0, 1, 0, 1),
  (3, 'current_stock',  0, 1, 0, 0, 1, 0, 1),
  (3, 'stock_history',  0, 1, 0, 0, 1, 0, 1),
  (3, 'expiry',         0, 1, 0, 0, 1, 0, 1);

INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`) VALUES
  ('clinic_name', 'City Clinic', 'Displayed in the app header and printed reports'),
  ('low_stock_threshold_days', '7', 'Days of stock remaining considered "low"'),
  ('near_expiry_threshold_days', '30', 'Days before expiry considered "near expiry"');

INSERT INTO `categories` (`name`, `description`, `status`) VALUES
  ('Surgical Equipment', 'Instruments & tools', 'active'),
  ('PPE & Safety', 'Protective equipment', 'active'),
  ('Diagnostics', 'Testing & measurement', 'active'),
  ('Consumables', 'Single-use supplies', 'active');

INSERT INTO `units` (`name`, `abbreviation`) VALUES
  ('Box', 'box'),
  ('Bottle', 'btl'),
  ('Piece', 'pc'),
  ('Pack', 'pk');

INSERT INTO `products` (`category_id`, `unit_id`, `product_code`, `product_name`, `generic_name`, `minimum_stock`, `status`) VALUES
  (2, 1, 'SG-100',  'Surgical Gloves (L)',     'Latex Gloves',       100, 'active'),
  (3, 3, 'DT-220',  'Digital Thermometer',     NULL,                  50, 'active'),
  (2, 4, 'N95-500', 'N95 Respirator Mask',     'Respirator',          60, 'active'),
  (4, 3, 'SY-050',  'Syringe 5ml',             'Disposable Syringe', 200, 'active'),
  (1, 3, 'SS-310',  'Surgical Scissors',       NULL,                  20, 'active');

INSERT INTO `suppliers` (`supplier_code`, `supplier_name`, `contact_name`, `phone`, `email`, `address`, `status`) VALUES
  ('SUP-100', 'MedSupply Co.',   'Sarah Lee',     '555-0142', 'sarah@medsupply.com',  '12 Harbor Rd',      'active'),
  ('SUP-101', 'HealthTech Ltd.', 'James Otieno',  '555-0198', 'james@healthtech.com', '88 Innovation Ave', 'active'),
  ('SUP-102', 'PharmaLine',      'Maria Chen',    '555-0233', 'maria@pharmaline.com', '5 Market St',       'inactive'),
  ('SUP-103', 'SteelMed Inc.',   'David Kim',     '555-0176', 'david@steelmed.com',   '200 Foundry Ln',    'active');

INSERT INTO `product_batches` (`product_id`, `batch_number`, `manufacture_date`, `expiry_date`, `received_quantity`, `available_quantity`, `purchase_price`, `status`) VALUES
  (1, 'BX-2201',  '2026-01-10', '2027-03-01', 200, 420, 11.20, 'active'),
  (2, 'DT-0099',  '2025-11-05', NULL,          50,  85, 21.00, 'active'),
  (3, 'N95-9081', '2025-09-01', '2026-08-15',  52,  12,  3.20, 'active'),
  (4, 'SY-6620',  '2025-10-12', '2027-02-01', 200,   0,  0.40, 'depleted'),
  (5, 'SS-4410',  '2025-06-01', NULL,          64,  64, 15.50, 'active');

INSERT INTO `stock_transactions` (`supplier_id`, `created_by`, `transaction_number`, `transaction_type`, `transaction_date`, `reference_number`, `reason`, `status`) VALUES
  (1, 1, 'STI-0001', 'stock_in',  '2026-07-20', 'PO-4471', NULL,           'completed'),
  (2, 1, 'STI-0002', 'stock_in',  '2026-07-22', 'PO-4482', NULL,           'completed'),
  (NULL, 1, 'STO-0001', 'stock_out', '2026-07-24', 'INV-8821', 'Sale',         'completed'),
  (NULL, 1, 'STO-0002', 'stock_out', '2026-07-25', NULL,      'Internal Use', 'completed');

INSERT INTO `stock_transaction_items` (`stock_transaction_id`, `product_id`, `batch_id`, `quantity`, `unit_price`) VALUES
  (1, 1, 1, 200, 11.20),
  (2, 2, 2,  50, 21.00),
  (3, 3, 3,  40,  3.20),
  (4, 4, 4, 200,  0.40);

INSERT INTO `stock_movements` (`product_id`, `batch_id`, `transaction_id`, `created_by`, `movement_type`, `quantity_before`, `movement_quantity`, `quantity_after`) VALUES
  (1, 1, 1, 1, 'stock_in',  220, 200, 420),
  (2, 2, 2, 1, 'stock_in',   35,  50,  85),
  (3, 3, 3, 1, 'stock_out',  52,  40,  12),
  (4, 4, 4, 1, 'stock_out', 200, 200,   0);

INSERT INTO `notifications` (`product_id`, `batch_id`, `notification_type`, `title`, `message`, `is_read`) VALUES
  (3, 3, 'low_stock',   'Low stock: N95 Respirator Mask', 'Available quantity (12) is below the minimum stock level (60).', 0),
  (3, 3, 'near_expiry',  'Batch N95-9081 nearing expiry',  'Expires 2026-08-15.', 0),
  (4, 4, 'low_stock',   'Out of stock: Syringe 5ml',      'Available quantity is 0.', 0);


-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

CREATE OR REPLACE VIEW `v_products` AS
SELECT
  p.id,
  p.product_code,
  p.product_name,
  p.generic_name,
  c.name AS category_name,
  u.name AS unit_name,
  u.abbreviation AS unit_abbreviation,
  COALESCE(SUM(pb.available_quantity), 0) AS available_quantity,
  p.minimum_stock,
  p.status
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
LEFT JOIN units u ON u.id = p.unit_id
LEFT JOIN product_batches pb ON pb.product_id = p.id AND pb.status = 'active'
GROUP BY p.id, p.product_code, p.product_name, p.generic_name, c.name, u.name, u.abbreviation, p.minimum_stock, p.status;

CREATE OR REPLACE VIEW `v_current_stock` AS
SELECT
  p.product_code,
  p.product_name,
  c.name AS category,
  u.name AS unit,
  COALESCE(SUM(pb.available_quantity), 0) AS available_quantity,
  p.minimum_stock
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
LEFT JOIN units u ON u.id = p.unit_id
LEFT JOIN product_batches pb ON pb.product_id = p.id AND pb.status = 'active'
GROUP BY p.id, p.product_code, p.product_name, c.name, u.name, p.minimum_stock;

CREATE OR REPLACE VIEW `v_near_expiry` AS
SELECT
  p.product_name AS product,
  pb.batch_number,
  pb.manufacture_date,
  pb.expiry_date,
  DATEDIFF(pb.expiry_date, CURDATE()) AS days_remaining,
  pb.available_quantity
FROM product_batches pb
JOIN products p ON p.id = pb.product_id
WHERE pb.expiry_date IS NOT NULL
  AND p.status = 'active'
  AND pb.status = 'active'
  AND pb.expiry_date >= CURDATE()
  AND pb.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
  AND pb.available_quantity > 0
ORDER BY pb.expiry_date ASC;

CREATE OR REPLACE VIEW `v_expired_products` AS
SELECT
  p.product_name AS product,
  pb.batch_number,
  pb.manufacture_date,
  pb.expiry_date,
  DATEDIFF(CURDATE(), pb.expiry_date) AS days_expired,
  pb.available_quantity
FROM product_batches pb
JOIN products p ON p.id = pb.product_id
WHERE pb.expiry_date IS NOT NULL
  AND p.status = 'active'
  AND pb.status = 'active'
  AND pb.available_quantity > 0
  AND pb.expiry_date < CURDATE()
ORDER BY pb.expiry_date DESC;

CREATE OR REPLACE VIEW `v_stock_history` AS
SELECT
  p.product_name AS product,
  pb.batch_number,
  sm.movement_type,
  sm.quantity_before,
  sm.movement_quantity,
  sm.quantity_after,
  DATE(sm.created_at) AS date
FROM stock_movements sm
JOIN products p ON p.id = sm.product_id
JOIN product_batches pb ON pb.id = sm.batch_id
ORDER BY sm.created_at DESC;

CREATE OR REPLACE VIEW `v_dashboard_summary` AS
SELECT
  (SELECT COUNT(*) FROM products WHERE status = 'active') AS total_products,
  (SELECT COALESCE(SUM(available_quantity), 0) FROM product_batches WHERE status = 'active') AS total_stock,
  (SELECT COUNT(*) FROM v_current_stock WHERE available_quantity > 0 AND available_quantity <= minimum_stock) AS low_stock,
  (SELECT COUNT(*) FROM v_current_stock WHERE available_quantity = 0) AS out_of_stock,
  (SELECT COALESCE(SUM(sti.quantity), 0)
     FROM stock_transactions st
     JOIN stock_transaction_items sti ON sti.stock_transaction_id = st.id
     WHERE st.transaction_type = 'stock_in' AND st.transaction_date = CURDATE()) AS stock_in_today,
  (SELECT COALESCE(SUM(sti.quantity), 0)
     FROM stock_transactions st
     JOIN stock_transaction_items sti ON sti.stock_transaction_id = st.id
     WHERE st.transaction_type = 'stock_out' AND st.transaction_date = CURDATE()) AS stock_out_today,
  (SELECT COUNT(*) FROM v_near_expiry) AS near_expiry,
  (SELECT COUNT(*) FROM v_expired_products) AS expired_products,
  (SELECT COUNT(*) FROM suppliers WHERE status = 'active') AS total_suppliers,
  (SELECT COUNT(*) FROM categories WHERE status = 'active') AS total_categories,
  (SELECT COUNT(*) FROM users WHERE status = 'active') AS total_users;
