-- Add file-operation permissions to an existing Medicine Inventory database.
-- Run this migration once before using the updated role-permission matrix.
ALTER TABLE `user_permissions`
  ADD COLUMN `can_export` TINYINT(1) NOT NULL DEFAULT 0 AFTER `can_delete`,
  ADD COLUMN `can_import` TINYINT(1) NOT NULL DEFAULT 0 AFTER `can_export`,
  ADD COLUMN `can_download_template` TINYINT(1) NOT NULL DEFAULT 0 AFTER `can_import`;

-- Preserve the Administrator's full-access behavior in stored permission rows.
UPDATE `user_permissions` AS permission
JOIN `users` AS user ON user.id = permission.user_id
JOIN `roles` AS role ON role.id = user.role_id
SET permission.can_export = 1,
    permission.can_import = 1,
    permission.can_download_template = 1
WHERE LOWER(role.name) = 'administrator';
