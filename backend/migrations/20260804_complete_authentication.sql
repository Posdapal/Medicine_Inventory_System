USE clinic_inventory;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS must_change_password TINYINT(1) NOT NULL DEFAULT 1 AFTER status;

-- Default account: admin@gmail.com / Admin@123
-- Change this password immediately after the first login.
INSERT INTO users (full_name, username, email, password, role, status, must_change_password)
VALUES (
  'System Administrator',
  'admin',
  'admin@gmail.com',
  '$2b$12$hMaTLDuUgL11LTVPS5sxoOYE/On.stDxD9vQTq0gu2yrMPmqy1zNG',
  'admin',
  'active',
  1
)
ON DUPLICATE KEY UPDATE
  email = VALUES(email),
  password = VALUES(password),
  status = 'active',
  must_change_password = 1;
