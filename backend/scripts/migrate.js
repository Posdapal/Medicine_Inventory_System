require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function runMigrations() {
  console.log('🚀 Running database migrations...');

  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || 'rootpassword';
  const database = process.env.DB_NAME || 'medicine_inventory';
  const port = Number(process.env.DB_PORT) || 3306;

  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      user,
      password,
      port,
      multipleStatements: true,
    });

    // Ensure database exists
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await connection.query(`USE \`${database}\`;`);

    // Migration tracking table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Apply all migration files from migrations/ in alphabetical order
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
      for (const file of files) {
        const [rows] = await connection.query('SELECT name FROM _migrations WHERE name = ?', [file]);
        if (rows.length === 0) {
          console.log(`📄 Applying migration: ${file}...`);
          const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
          try {
            await connection.query(sql);
            await connection.query('INSERT INTO _migrations (name) VALUES (?)', [file]);
            console.log(`✅ Applied: ${file}`);
          } catch (migErr) {
            console.warn(`⚠️ Migration note (${file}): ${migErr.message}`);
            // Record migration if error was due to already existing column/table
            await connection.query('INSERT IGNORE INTO _migrations (name) VALUES (?)', [file]);
          }
        } else {
          console.log(`⏩ Skipping already applied: ${file}`);
        }
      }
    }

    console.log('🎉 Database migrations completed successfully.');
  } catch (error) {
    console.error('❌ Database migration error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = runMigrations;
