// Runs against an isolated temporary database; never migrates the application database.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const mysql = require('mysql2/promise');
const runMigrations = require('./migrate');

async function verify() {
  const originalDatabase = process.env.DB_NAME;
  const database = `migration_test_${randomUUID().replaceAll('-', '')}`;
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD ?? 'rootpassword',
  });
  let created = false;
  try {
    // No IF NOT EXISTS: only clean up a database this invocation actually created.
    await connection.query(`CREATE DATABASE \`${database}\``);
    created = true;
    process.env.DB_NAME = database;
    await runMigrations(1);
    await connection.query(`USE \`${database}\``);

    const [history, fields] = await connection.query('SELECT * FROM v_stock_history LIMIT 1');
    assert.equal(history.length, 0);
    assert.deepEqual(fields.map((field) => field.name), [
      'product', 'batch_number', 'movement_type', 'quantity_before',
      'movement_quantity', 'quantity_after', 'date',
    ]);
    const [settings] = await connection.query('SELECT * FROM user_settings WHERE user_id = 1');
    assert.equal(settings.length, 1);
    assert.equal(settings[0].theme, 'system');
    assert.equal(settings[0].notifications_email, 1);
    await assert.rejects(connection.query('INSERT INTO user_settings (user_id) VALUES (1)'), { code: 'ER_DUP_ENTRY' });
    await assert.rejects(connection.query('INSERT INTO user_settings (user_id) VALUES (4294967295)'), { code: 'ER_NO_REFERENCED_ROW_2' });

    await connection.query("UPDATE user_settings SET theme = 'dark' WHERE user_id = 1");
    await runMigrations(1); // Already tracked: nothing should run.
    // Replay the new migrations to verify safe recovery after a partial migration.
    await connection.query("DELETE FROM _migrations WHERE name IN ('20260908_create_stock_history_view.sql', '20260908_create_user_settings.sql')");
    await runMigrations(1);
    const [after] = await connection.query('SELECT theme FROM user_settings WHERE user_id = 1');
    assert.deepEqual(after, [{ theme: 'dark' }]);
    await connection.query('SELECT * FROM v_stock_history WHERE product LIKE ? ORDER BY date DESC', ['%test%']);
    console.log('PASS: fresh migrations, stock-history query, settings defaults, foreign/unique keys, and repeat runs');
  } finally {
    if (originalDatabase === undefined) delete process.env.DB_NAME;
    else process.env.DB_NAME = originalDatabase;
    try {
      if (created) await connection.query(`DROP DATABASE \`${database}\``);
    } finally {
      await connection.end();
    }
  }
}

verify().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
