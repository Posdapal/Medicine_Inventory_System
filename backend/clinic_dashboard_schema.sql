-- =====================================================================
-- CLINIC ERP DATABASE SCHEMA
-- For use with MySQL / MariaDB in XAMPP (phpMyAdmin)
-- Covers: Patients, Medicines, Suppliers, Categories, Products,
--         Prescriptions, Reports, User Management (admin / user),
--         Settings (admin profile)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS clinic_inventory
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE clinic_inventory;

SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- 1. USERS  (User Management: admin or user)
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name       VARCHAR(120)        NOT NULL,
    username        VARCHAR(60)         NOT NULL UNIQUE,
    email           VARCHAR(150)        NOT NULL UNIQUE,
    password        VARCHAR(255)        NOT NULL,          -- store hashed password
    phone           VARCHAR(30)         NULL,
    role            ENUM('admin','user') NOT NULL DEFAULT 'user',
    profile_image   VARCHAR(255)        NULL,
    status          ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at      TIMESTAMP           DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP           DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Settings page: admin profile & preferences (1-to-1 with users)
CREATE TABLE user_settings (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id             INT UNSIGNED NOT NULL UNIQUE,
    address             VARCHAR(255) NULL,
    date_of_birth       DATE         NULL,
    gender              ENUM('male','female','other') NULL,
    theme               ENUM('light','dark') NOT NULL DEFAULT 'dark',
    language            VARCHAR(20)  NOT NULL DEFAULT 'en',
    notifications_email TINYINT(1)   NOT NULL DEFAULT 1,
    notifications_sms   TINYINT(1)   NOT NULL DEFAULT 0,
    two_factor_enabled  TINYINT(1)   NOT NULL DEFAULT 0,
    updated_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_settings_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. CATEGORIES  (shared lookup for both Medicines and Products)
-- ---------------------------------------------------------------------
CREATE TABLE categories (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    type        ENUM('medicine','product') NOT NULL DEFAULT 'medicine',
    description VARCHAR(255) NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_category_name_type (name, type)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3. SUPPLIERS
-- ---------------------------------------------------------------------
CREATE TABLE suppliers (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    contact_person  VARCHAR(120) NULL,
    phone           VARCHAR(30)  NULL,
    email           VARCHAR(150) NULL,
    address         VARCHAR(255) NULL,
    status          ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4. MEDICINES  (prescribable drugs: tablet, syrup, injection, ...)
-- ---------------------------------------------------------------------
CREATE TABLE medicines (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    category_id     INT UNSIGNED NOT NULL,
    supplier_id     INT UNSIGNED NULL,
    unit            VARCHAR(30)  NOT NULL DEFAULT 'unit',   -- e.g. tablet, bottle, vial
    price           DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    stock_quantity  INT UNSIGNED NOT NULL DEFAULT 0,        -- drives "Medicine Stock Report" chart
    reorder_level   INT UNSIGNED NOT NULL DEFAULT 10,       -- threshold for "Low Stock" card
    expiry_date     DATE NULL,
    description     TEXT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_medicine_category FOREIGN KEY (category_id)
        REFERENCES categories(id) ON DELETE RESTRICT,
    CONSTRAINT fk_medicine_supplier FOREIGN KEY (supplier_id)
        REFERENCES suppliers(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 5. PRODUCTS  (non-prescribable inventory: equipment, consumables, supplies)
-- ---------------------------------------------------------------------
CREATE TABLE products (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    sku             VARCHAR(60)  NULL UNIQUE,
    category_id     INT UNSIGNED NOT NULL,
    supplier_id     INT UNSIGNED NULL,
    unit            VARCHAR(30)  NOT NULL DEFAULT 'unit',
    price           DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    stock_quantity  INT UNSIGNED NOT NULL DEFAULT 0,
    reorder_level   INT UNSIGNED NOT NULL DEFAULT 10,
    description     TEXT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_category FOREIGN KEY (category_id)
        REFERENCES categories(id) ON DELETE RESTRICT,
    CONSTRAINT fk_product_supplier FOREIGN KEY (supplier_id)
        REFERENCES suppliers(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 6. PATIENTS
-- ---------------------------------------------------------------------
CREATE TABLE patients (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name       VARCHAR(150) NOT NULL,
    gender          ENUM('male','female','other') NULL,
    date_of_birth   DATE NULL,
    phone           VARCHAR(30) NULL,
    email           VARCHAR(150) NULL,
    address         VARCHAR(255) NULL,
    blood_group     VARCHAR(5) NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 7. PRESCRIPTIONS  (a visit / prescription issued to a patient)
-- ---------------------------------------------------------------------
CREATE TABLE prescriptions (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    patient_id          INT UNSIGNED NOT NULL,
    prescribed_by       INT UNSIGNED NOT NULL,          -- FK -> users.id
    prescription_date   DATE NOT NULL DEFAULT (CURRENT_DATE),
    diagnosis           VARCHAR(255) NULL,
    notes               TEXT NULL,
    status              ENUM('pending','dispensed','cancelled') NOT NULL DEFAULT 'pending',
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_prescription_patient FOREIGN KEY (patient_id)
        REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_prescription_user FOREIGN KEY (prescribed_by)
        REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Junction table: which medicines (and quantities) belong to a prescription
CREATE TABLE prescription_items (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    prescription_id     INT UNSIGNED NOT NULL,
    medicine_id         INT UNSIGNED NOT NULL,
    quantity            INT UNSIGNED NOT NULL DEFAULT 1,
    dosage              VARCHAR(100) NULL,               -- e.g. "1 tablet twice a day"
    instructions        VARCHAR(255) NULL,
    CONSTRAINT fk_item_prescription FOREIGN KEY (prescription_id)
        REFERENCES prescriptions(id) ON DELETE CASCADE,
    CONSTRAINT fk_item_medicine FOREIGN KEY (medicine_id)
        REFERENCES medicines(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 8. STOCK TRANSACTIONS  (in / out / adjustment log, for medicines OR products)
--    Exactly one of medicine_id / product_id should be set per row.
-- ---------------------------------------------------------------------
CREATE TABLE stock_transactions (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    medicine_id         INT UNSIGNED NULL,
    product_id          INT UNSIGNED NULL,
    supplier_id         INT UNSIGNED NULL,               -- filled when transaction_type = 'in'
    transaction_type    ENUM('in','out','adjustment') NOT NULL,
    quantity            INT NOT NULL,
    reference_id        INT UNSIGNED NULL,               -- e.g. prescription_items.id when type = 'out'
    transaction_date    DATE NOT NULL DEFAULT (CURRENT_DATE),
    notes               VARCHAR(255) NULL,
    created_by          INT UNSIGNED NULL,               -- FK -> users.id
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_stock_medicine FOREIGN KEY (medicine_id)
        REFERENCES medicines(id) ON DELETE CASCADE,
    CONSTRAINT fk_stock_product FOREIGN KEY (product_id)
        REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_stock_supplier FOREIGN KEY (supplier_id)
        REFERENCES suppliers(id) ON DELETE SET NULL,
    CONSTRAINT fk_stock_user FOREIGN KEY (created_by)
        REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_stock_one_item CHECK (
        (medicine_id IS NOT NULL AND product_id IS NULL) OR
        (medicine_id IS NULL AND product_id IS NOT NULL)
    )
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 9. MEDICINE USAGE  (monthly usage log -> feeds "Medicine Usage Report" line chart)
-- ---------------------------------------------------------------------
CREATE TABLE medicine_usage (
    id                      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    medicine_id             INT UNSIGNED NOT NULL,
    usage_date              DATE NOT NULL,
    quantity_used           INT UNSIGNED NOT NULL DEFAULT 0,
    prescription_item_id    INT UNSIGNED NULL,              -- optional link back to source
    CONSTRAINT fk_usage_medicine FOREIGN KEY (medicine_id)
        REFERENCES medicines(id) ON DELETE CASCADE,
    CONSTRAINT fk_usage_item FOREIGN KEY (prescription_item_id)
        REFERENCES prescription_items(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 10. REPORTS  (saved / generated report snapshots)
-- ---------------------------------------------------------------------
CREATE TABLE reports (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title               VARCHAR(150) NOT NULL,
    report_type         ENUM('medicine_usage','medicine_stock','patients','suppliers','products','custom') NOT NULL,
    date_range_start    DATE NULL,
    date_range_end      DATE NULL,
    generated_by        INT UNSIGNED NOT NULL,           -- FK -> users.id
    data_snapshot       JSON NULL,                        -- cached chart data for quick reload
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_report_user FOREIGN KEY (generated_by)
        REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- HELPFUL VIEWS FOR THE DASHBOARD CARDS / CHARTS
-- =====================================================================

CREATE OR REPLACE VIEW v_low_stock_medicines AS
SELECT m.id, m.name, c.name AS category, m.stock_quantity, m.reorder_level
FROM medicines m
JOIN categories c ON c.id = m.category_id
WHERE m.stock_quantity <= m.reorder_level;

CREATE OR REPLACE VIEW v_low_stock_products AS
SELECT p.id, p.name, c.name AS category, p.stock_quantity, p.reorder_level
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE p.stock_quantity <= p.reorder_level;

CREATE OR REPLACE VIEW v_stock_by_category AS
SELECT c.name AS category, SUM(m.stock_quantity) AS total_stock
FROM medicines m
JOIN categories c ON c.id = m.category_id
GROUP BY c.name;

CREATE OR REPLACE VIEW v_monthly_usage AS
SELECT DATE_FORMAT(usage_date, '%Y-%m') AS usage_month, SUM(quantity_used) AS total_used
FROM medicine_usage
GROUP BY DATE_FORMAT(usage_date, '%Y-%m')
ORDER BY usage_month;

CREATE OR REPLACE VIEW v_dashboard_summary AS
SELECT
    (SELECT COUNT(*) FROM patients)                                   AS total_patients,
    (SELECT COUNT(*) FROM medicines)                                  AS total_medicines,
    (SELECT COUNT(*) FROM products)                                   AS total_products,
    (SELECT COUNT(*) FROM suppliers WHERE status = 'active')          AS total_suppliers,
    (SELECT COUNT(*) FROM v_low_stock_medicines)
      + (SELECT COUNT(*) FROM v_low_stock_products)                   AS low_stock_count;

-- =====================================================================
-- SAMPLE SEED DATA (optional - remove if not needed)
-- =====================================================================
INSERT INTO categories (name, type) VALUES
    ('Tablet', 'medicine'), ('Syrup', 'medicine'), ('Injection', 'medicine'),
    ('Vitamin', 'medicine'), ('Antibiotic', 'medicine'),
    ('Medical Equipment', 'product'), ('Consumables', 'product');

INSERT INTO users (full_name, username, email, password, role)
VALUES ('Admin User', 'admin', 'admin@clinic.local', '$2y$10$replaceWithARealBcryptHash', 'admin');

INSERT INTO user_settings (user_id) VALUES (1);
