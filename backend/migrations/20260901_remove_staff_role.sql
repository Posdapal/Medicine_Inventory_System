-- Retire the legacy Staff role while preserving all existing user accounts.
-- Role IDs remain database-controlled; no ID is assumed here.
INSERT INTO roles (name, description, status)
VALUES ('Stock Staff', 'Receiving and stock operations', 'active')
ON DUPLICATE KEY UPDATE description = VALUES(description), status = 'active';

UPDATE users u
JOIN roles legacy_role ON legacy_role.id = u.role_id AND LOWER(legacy_role.name) = 'staff'
JOIN roles stock_role ON LOWER(stock_role.name) = 'stock staff'
SET u.role_id = stock_role.id;

DELETE FROM roles WHERE LOWER(name) = 'staff';
