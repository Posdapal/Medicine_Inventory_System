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

async function queryPage(req, sql, params = [], orderBy = '') {
  const paginationRequested = req.query.page !== undefined || req.query.limit !== undefined;
  if (!paginationRequested) return query(`${sql}${orderBy ? ` ${orderBy}` : ''}`, params);

  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
  const countRows = await query(`SELECT COUNT(*) AS total FROM (${sql}) AS paginated_results`, params);
  const total = Number(countRows[0]?.total || 0);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const effectivePage = Math.min(page, totalPages);
  const offset = (effectivePage - 1) * limit;
  const items = await query(`${sql}${orderBy ? ` ${orderBy}` : ''} LIMIT ? OFFSET ?`, [...params, limit, offset]);

  return {
    items,
    pagination: { page: effectivePage, limit, total, total_pages: totalPages },
  };
}

module.exports = { query, queryPage, beginTransaction, commit, rollback, ok, fail, asyncHandler };
