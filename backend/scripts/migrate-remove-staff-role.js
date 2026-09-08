require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  database: process.env.DB_NAME || 'medicine_inventory',
  multipleStatements: true,
});

const sql = fs.readFileSync(
  path.join(__dirname, '..', 'migrations', '20260901_remove_staff_role.sql'),
  'utf8'
);

db.query(sql, (error) => {
  if (error) {
    console.error(`Staff-role migration failed: ${error.message}`);
    process.exitCode = 1;
  } else {
    console.log('Staff role migrated to Stock Staff and removed.');
  }
  db.end();
});
