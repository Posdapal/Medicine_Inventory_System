-- ============================================================================
-- 20260801_default_init_schema.sql
-- Default Base Migration: Tables, Relations, and Default Seed Data
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- ROLES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `roles` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name`        VARCHAR(50)  NOT NULL,
  `description` VARCHAR(255) NULL,
  `status`      ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_roles_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- USERS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `role_id`     INT UNSIGNED NOT NULL,
  `full_name`   VARCHAR(150) NOT NULL,
  `username`    VARCHAR(100) NOT NULL,
  `email`       VARCHAR(150) NULL,
  `password`    VARCHAR(255) NOT NULL,
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
-- ROLE_PERMISSIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `role_id`     INT UNSIGNED NOT NULL,
  `module`      VARCHAR(50)  NOT NULL,
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
-- CATEGORIES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `categories` (
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
CREATE TABLE IF NOT EXISTS `units` (
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
CREATE TABLE IF NOT EXISTS `products` (
  `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `category_id`    INT UNSIGNED NULL,
  `unit_id`        INT UNSIGNED NULL,
  `product_code`   VARCHAR(50)  NOT NULL,
  `product_name`   VARCHAR(200) NOT NULL,
  `generic_name`   VARCHAR(200) NULL,
  `description`    TEXT         NULL,
  `image_url`      LONGTEXT     NULL,
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
CREATE TABLE IF NOT EXISTS `suppliers` (
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
CREATE TABLE IF NOT EXISTS `product_batches` (
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
CREATE TABLE IF NOT EXISTS `stock_transactions` (
  `id`                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `supplier_id`         INT UNSIGNED NULL,
  `created_by`          INT UNSIGNED NULL,
  `transaction_number`  VARCHAR(50)  NOT NULL,
  `transaction_type`    ENUM('stock_in','stock_out') NOT NULL,
  `transaction_date`    DATE NOT NULL,
  `reference_number`    VARCHAR(100) NULL,
  `reason`              VARCHAR(255) NULL,
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
CREATE TABLE IF NOT EXISTS `stock_transaction_items` (
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
CREATE TABLE IF NOT EXISTS `stock_movements` (
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
CREATE TABLE IF NOT EXISTS `notifications` (
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
CREATE TABLE IF NOT EXISTS `reports` (
  `id`               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title`            VARCHAR(200) NOT NULL,
  `report_type`      ENUM('inventory','stock_in','stock_out','stock_movement','low_stock','near_expiry') NOT NULL,
  `date_range_start` DATE NULL,
  `date_range_end`   DATE NULL,
  `generated_by`     INT UNSIGNED NULL,
  `data_snapshot`    JSON NULL,
  `created_at`       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_reports_generated_by` (`generated_by`),
  KEY `idx_reports_type` (`report_type`),
  CONSTRAINT `fk_reports_user`
    FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- SYSTEM_SETTINGS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id`            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `setting_key`   VARCHAR(100) NOT NULL,
  `setting_value` TEXT         NULL,
  `description`   VARCHAR(255) NULL,
  `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_settings_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- DEFAULT SEED DATA
-- ============================================================================

INSERT INTO `roles` (`id`, `name`, `description`, `status`) VALUES
  (1, 'Administrator', 'Full access to all modules and permissions', 'active'),
  (2, 'Pharmacist', 'Dispensing and inventory visibility', 'active'),
  (3, 'Stock Staff', 'Receiving and stock operations', 'active')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `status` = 'active';

-- Default admin user: admin@gmail.com / Admin@123
INSERT INTO `users` (`id`, `role_id`, `full_name`, `username`, `email`, `password`, `status`, `must_change_password`) VALUES
  (1, 1, 'Admin User', 'admin', 'admin@gmail.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'active', 0)
ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);

INSERT INTO `categories` (`id`, `name`, `description`, `status`) VALUES
  (1, 'Surgical Equipment', 'Instruments & tools', 'active'),
  (2, 'PPE & Safety', 'Protective equipment', 'active'),
  (3, 'Diagnostics', 'Testing & measurement', 'active'),
  (4, 'Consumables', 'Single-use supplies', 'active')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `units` (`id`, `name`, `abbreviation`) VALUES
  (1, 'Box', 'box'),
  (2, 'Bottle', 'btl'),
  (3, 'Piece', 'pc'),
  (4, 'Pack', 'pk')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`) VALUES
  ('clinic_name', 'Medicine Inventory System', 'Displayed in the app header and printed reports'),
  ('low_stock_threshold_days', '7', 'Days of stock remaining considered "low"'),
  ('near_expiry_threshold_days', '30', 'Days before expiry considered "near expiry"')
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);
