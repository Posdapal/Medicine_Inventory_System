const util = require('util');
const db = require('../config/db');

// Promisify db.query so controllers can use async/await instead of callbacks
const query = util.promisify(db.query).bind(db);

// Promisified transaction helpers (needed for prescriptions + stock updates)
const beginTransaction = () =>
  new Promise((resolve, reject) => db.beginTransaction((err) => (err ? reject(err) : resolve())));

const commit = () =>
  new Promise((resolve, reject) => db.commit((err) => (err ? reject(err) : resolve())));

const rollback = () =>
  new Promise((resolve) => db.rollback(() => resolve()));

// Consistent response envelope: { success, message, data }
function ok(res, data = null, message = 'Success', status = 200) {
  return res.status(status).json({ success: true, message, data });
}

function fail(res, message = 'Something went wrong', status = 500, errors = null) {
  return res.status(status).json({ success: false, message, errors });
}

// Wraps async controller functions so thrown errors reach errorHandler.middleware.js
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { query, beginTransaction, commit, rollback, ok, fail, asyncHandler };
