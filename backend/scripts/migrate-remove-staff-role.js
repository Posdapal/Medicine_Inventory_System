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
