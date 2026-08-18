const { query, ok, asyncHandler } = require('../utils/helper');

// GET /api/expiry/near?search=
const getNearExpiry = asyncHandler(async (req, res) => {
  const search = req.query.search ? `%${req.query.search}%` : '%';
  const rows = await query(
    `SELECT * FROM v_near_expiry WHERE product LIKE ? OR batch_number LIKE ? ORDER BY expiry_date ASC`,
    [search, search]
  );
  return ok(res, rows);
});

// GET /api/expiry/expired?search=
const getExpired = asyncHandler(async (req, res) => {
  const search = req.query.search ? `%${req.query.search}%` : '%';
  const rows = await query(
    `SELECT * FROM v_expired_products WHERE product LIKE ? OR batch_number LIKE ? ORDER BY expiry_date DESC`,
    [search, search]
  );
  return ok(res, rows);
});

module.exports = { getNearExpiry, getExpired };
