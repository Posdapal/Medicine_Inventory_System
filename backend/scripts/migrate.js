require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

function splitSqlStatements(sql) {
  const cleanSql = sql.replace(/\/\*[\s\S]*?\*\//g, '');
  const statements = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;

  for (let i = 0; i < cleanSql.length; i++) {
    const char = cleanSql[i];
    const prevChar = i > 0 ? cleanSql[i - 1] : '';

    if (char === '-' && cleanSql[i + 1] === '-' && !inSingleQuote && !inDoubleQuote && !inBacktick) {
      while (i < cleanSql.length && cleanSql[i] !== '\n') {
        i++;
      }
      continue;
    }

    if (char === "'" && prevChar !== '\\' && !inDoubleQuote && !inBacktick) {
      inSingleQuote = !inSingleQuote;
    } else if (char === '"' && prevChar !== '\\' && !inSingleQuote && !inBacktick) {
      inDoubleQuote = !inDoubleQuote;
    } else if (char === '`' && prevChar !== '\\' && !inSingleQuote && !inDoubleQuote) {
      inBacktick = !inBacktick;
    }

    if (char === ';' && !inSingleQuote && !inDoubleQuote && !inBacktick) {
      const stmt = current.trim();
      if (stmt.length > 0) {
        statements.push(stmt);
      }
      current = '';
    } else {
      current += char;
    }
  }

  const stmt = current.trim();
  if (stmt.length > 0) {
    statements.push(stmt);
  }

  return statements;
}

async function runMigrations(maxRetries = 10, delayMs = 3000) {
  console.log('🚀 Running database migrations...');

  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || 'rootpassword';
  const database = process.env.DB_NAME || 'medicine_inventory';
  const port = Number(process.env.DB_PORT) || 3306;

  let connection;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      connection = await mysql.createConnection({
        host,
        user,
        password,
        port,
      });
      break;
    } catch (connErr) {
      retries++;
      console.warn(`⏳ Waiting for database connection (${retries}/${maxRetries}): ${connErr.message}`);
      if (retries >= maxRetries) {
        console.error('❌ Could not connect to MySQL server after maximum retries.');
        throw connErr;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  try {
    // 1. Ensure database exists and select it
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await connection.query(`USE \`${database}\`;`);

    // 2. Migration tracking table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. Verify if users table actually exists; if missing, reset initial migration state
    const [tables] = await connection.query("SHOW TABLES LIKE 'users'");
    if (tables.length === 0) {
      console.log('ℹ️ Table `users` not found. Resetting _migrations tracking for base schema.');
      await connection.query("DELETE FROM _migrations WHERE name = '20260801_default_init_schema.sql'");
    }

    // 4. Apply all migration files from migrations/ in alphabetical order
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
      for (const file of files) {
        const [rows] = await connection.query('SELECT name FROM _migrations WHERE name = ?', [file]);
        if (rows.length === 0) {
          console.log(`📄 Applying migration: ${file}...`);
          const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
          const statements = splitSqlStatements(sql);

          let hasFatalError = false;
          for (const statement of statements) {
            try {
              await connection.query(statement);
            } catch (stmtErr) {
              if (
                stmtErr.code === 'ER_TABLE_EXISTS_ERROR' ||
                stmtErr.code === 'ER_DUP_FIELDNAME' ||
                stmtErr.code === 'ER_DUP_KEYNAME' ||
                stmtErr.code === 'ER_DUP_ENTRY'
              ) {
                console.warn(`  ↳ Note: ${stmtErr.message}`);
              } else {
                console.error(`  ↳ Error executing statement: ${stmtErr.message}`);
                hasFatalError = true;
              }
            }
          }

          if (!hasFatalError) {
            await connection.query('INSERT INTO _migrations (name) VALUES (?)', [file]);
            console.log(`✅ Applied: ${file}`);
          } else {
            console.warn(`⚠️ Migration ${file} completed with errors; will re-evaluate on next startup.`);
          }
        } else {
          console.log(`⏩ Skipping already applied: ${file}`);
        }
      }
    }

    console.log('🎉 Database migrations completed successfully.');
  } catch (error) {
    console.error('❌ Database migration error:', error.message);
    throw error;
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

