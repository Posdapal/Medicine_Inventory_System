-- Shared by the user-profile and settings endpoints.
CREATE TABLE IF NOT EXISTS user_settings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  address TEXT NULL,
  date_of_birth DATE NULL,
  gender VARCHAR(30) NOT NULL DEFAULT 'unspecified',
  theme VARCHAR(20) NOT NULL DEFAULT 'system',
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  notifications_telegram TINYINT(1) NOT NULL DEFAULT 0,
  notifications_email TINYINT(1) NOT NULL DEFAULT 1,
  two_factor_enabled TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_settings_user_id (user_id),
  CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Preserve any preferences already saved; initialize only users without a row.
INSERT INTO user_settings (user_id)
SELECT u.id FROM users u
LEFT JOIN user_settings s ON s.user_id = u.id
WHERE s.user_id IS NULL;
