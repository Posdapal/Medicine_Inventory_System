-- Role-based access control. Safe to run after the original schema.
ALTER TABLE roles ADD COLUMN status ENUM('active','inactive') NOT NULL DEFAULT 'active' AFTER description;

CREATE TABLE IF NOT EXISTS role_permissions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_id INT UNSIGNED NOT NULL,
  module VARCHAR(50) NOT NULL,
  can_create TINYINT(1) NOT NULL DEFAULT 0,
  can_read TINYINT(1) NOT NULL DEFAULT 0,
  can_update TINYINT(1) NOT NULL DEFAULT 0,
  can_delete TINYINT(1) NOT NULL DEFAULT 0,
  can_export TINYINT(1) NOT NULL DEFAULT 0,
  can_import TINYINT(1) NOT NULL DEFAULT 0,
  can_print TINYINT(1) NOT NULL DEFAULT 0,
  UNIQUE KEY uq_role_module (role_id, module),
  CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

INSERT INTO roles (name, description, status) VALUES
 ('Administrator', 'Full access to all modules and permissions', 'active'),
 ('Pharmacist', 'Dispensing and inventory visibility', 'active'),
 ('Stock Staff', 'Receiving and stock operations', 'active')
ON DUPLICATE KEY UPDATE description=VALUES(description), status='active';

-- Retire the legacy role without losing users created by older installations.
UPDATE users u
JOIN roles legacy_role ON legacy_role.id=u.role_id AND LOWER(legacy_role.name)='staff'
JOIN roles stock_role ON LOWER(stock_role.name)='stock staff'
SET u.role_id=stock_role.id;
DELETE FROM roles WHERE LOWER(name)='staff';

-- Re-running this seed restores the documented defaults for the two built-in operational roles.
DELETE rp FROM role_permissions rp JOIN roles r ON r.id=rp.role_id WHERE r.name IN ('Pharmacist','Stock Staff');
INSERT INTO role_permissions (role_id,module,can_create,can_read,can_update,can_delete,can_export,can_import,can_print)
SELECT r.id,p.module,p.c,p.v,p.u,p.d,p.e,p.i,p.pr FROM roles r JOIN (
 SELECT 'Pharmacist' role_name,'dashboard' module,0 c,1 v,0 u,0 d,0 e,0 i,0 pr UNION ALL
 SELECT 'Pharmacist','products',1,1,1,0,0,0,0 UNION ALL SELECT 'Pharmacist','categories',0,1,0,0,0,0,0 UNION ALL
 SELECT 'Pharmacist','units',0,1,0,0,0,0,0 UNION ALL SELECT 'Pharmacist','suppliers',0,1,0,0,0,0,0 UNION ALL
 SELECT 'Pharmacist','stock_in',0,1,0,0,0,0,0 UNION ALL SELECT 'Pharmacist','stock_out',1,1,0,0,0,0,0 UNION ALL
 SELECT 'Pharmacist','current_stock',0,1,0,0,1,0,1 UNION ALL SELECT 'Pharmacist','stock_history',0,1,0,0,0,0,0 UNION ALL
 SELECT 'Pharmacist','expiry',0,1,0,0,1,0,1 UNION ALL SELECT 'Pharmacist','reports',0,1,0,0,0,0,0 UNION ALL
 SELECT 'Stock Staff','dashboard',0,1,0,0,0,0,0 UNION ALL SELECT 'Stock Staff','products',0,1,0,0,0,0,0 UNION ALL
 SELECT 'Stock Staff','categories',0,1,0,0,0,0,0 UNION ALL SELECT 'Stock Staff','units',0,1,0,0,0,0,0 UNION ALL
 SELECT 'Stock Staff','suppliers',1,1,1,0,0,0,0 UNION ALL SELECT 'Stock Staff','stock_in',1,1,1,0,0,0,0 UNION ALL
 SELECT 'Stock Staff','stock_out',1,1,0,0,0,0,0 UNION ALL SELECT 'Stock Staff','current_stock',0,1,0,0,1,0,1 UNION ALL
 SELECT 'Stock Staff','stock_history',0,1,0,0,1,0,1 UNION ALL SELECT 'Stock Staff','expiry',0,1,0,0,1,1,1 UNION ALL
 SELECT 'Stock Staff','reports',0,1,0,0,0,0,0
) p ON p.role_name=r.name;
