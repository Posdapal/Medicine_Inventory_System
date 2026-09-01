require('dotenv').config();

const db = require('../src/config/db');

const query = (sql, params = []) => new Promise((resolve, reject) => {
  db.query(sql, params, (error, rows) => (error ? reject(error) : resolve(rows)));
});

const columns = [
  ['can_export', 'can_delete'],
  ['can_import', 'can_export'],
  ['can_download_template', 'can_import'],
];

async function migrate() {
  const existingRows = await query('SHOW COLUMNS FROM user_permissions');
  const existing = new Set(existingRows.map((row) => row.Field));

  for (const [column, after] of columns) {
    if (existing.has(column)) {
      console.log(`${column}: already present`);
      continue;
    }

    await query(
      `ALTER TABLE user_permissions ADD COLUMN ${column} TINYINT(1) NOT NULL DEFAULT 0 AFTER ${after}`
    );
    existing.add(column);
    console.log(`${column}: added`);
  }

  await query(
    `UPDATE user_permissions AS permission
     JOIN users AS user ON user.id = permission.user_id
     JOIN roles AS role ON role.id = user.role_id
     SET permission.can_export = 1,
         permission.can_import = 1,
         permission.can_download_template = 1
     WHERE LOWER(role.name) = 'administrator'`
  );

  const verifiedRows = await query('SHOW COLUMNS FROM user_permissions');
  const verified = new Set(verifiedRows.map((row) => row.Field));
  const missing = columns.map(([column]) => column).filter((column) => !verified.has(column));
  if (missing.length) throw new Error(`Migration verification failed: ${missing.join(', ')}`);

  console.log('Permission file-action migration complete.');
}

migrate()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => db.end());
