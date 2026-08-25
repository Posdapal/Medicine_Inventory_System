const { queryPage, ok, asyncHandler } = require('../utils/helper');

// GET /api/expiry/near?search=
const getNearExpiry = asyncHandler(async (req, res) => {
  const search = req.query.search ? `%${req.query.search}%` : '%';
  const rows = await queryPage(req,
    `SELECT p.product_name AS product, pb.batch_number, pb.manufacture_date, pb.expiry_date,
            DATEDIFF(pb.expiry_date, CURDATE()) AS days_remaining, pb.available_quantity
       FROM product_batches pb
       JOIN products p ON p.id = pb.product_id
      WHERE p.status = 'active' AND pb.status = 'active' AND pb.available_quantity > 0
        AND pb.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        AND (p.product_name LIKE ? OR pb.batch_number LIKE ?)`,
    [search, search],
    'ORDER BY pb.expiry_date ASC'
  );
  return ok(res, rows);
});

// GET /api/expiry/expired?search=
const getExpired = asyncHandler(async (req, res) => {
  const search = req.query.search ? `%${req.query.search}%` : '%';
  const rows = await queryPage(req,
    `SELECT p.product_name AS product, pb.batch_number, pb.manufacture_date, pb.expiry_date,
            DATEDIFF(CURDATE(), pb.expiry_date) AS days_expired, pb.available_quantity
       FROM product_batches pb
       JOIN products p ON p.id = pb.product_id
      WHERE p.status = 'active' AND pb.status = 'active' AND pb.available_quantity > 0
        AND pb.expiry_date < CURDATE()
        AND (p.product_name LIKE ? OR pb.batch_number LIKE ?)`,
    [search, search],
    'ORDER BY pb.expiry_date DESC'
  );
  return ok(res, rows);
});

module.exports = { getNearExpiry, getExpired };
