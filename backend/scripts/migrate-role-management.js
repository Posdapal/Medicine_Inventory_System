require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mysql = require('mysql');

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true,
});

let sql = fs.readFileSync(
  path.join(__dirname, '..', 'migrations', '20260830_dynamic_role_management.sql'),
  'utf8'
);

db.query("SHOW COLUMNS FROM roles LIKE 'status'", (columnError, rows) => {
  if (columnError) {
    console.error(`Role migration failed: ${columnError.message}`);
    db.end();
    process.exitCode = 1;
    return;
  }
  if (rows.length) {
    sql = sql.replace(/ALTER TABLE roles ADD COLUMN status[^;]+;/i, '');
  }
  db.query(sql, (error) => {
    if (error) {
      console.error(`Role migration failed: ${error.message}`);
      process.exitCode = 1;
    } else {
      console.log('Dynamic role-management migration complete.');
    }
    db.end();
  });
});
