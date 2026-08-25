const { query, ok, asyncHandler } = require('../utils/helper');

const loadSummary = async () => {
  const rows = await query(
    `SELECT
       (SELECT COUNT(*) FROM products p WHERE p.status = 'active') AS total_products,
       (SELECT COALESCE(SUM(pb.available_quantity), 0)
          FROM product_batches pb
          JOIN products p ON p.id = pb.product_id
         WHERE pb.status = 'active' AND p.status = 'active') AS total_stock,
       (SELECT COUNT(*)
          FROM products p
         WHERE p.status = 'active'
           AND (SELECT COALESCE(SUM(pb.available_quantity), 0)
                  FROM product_batches pb
                 WHERE pb.product_id = p.id AND pb.status = 'active') > 0
           AND (SELECT COALESCE(SUM(pb.available_quantity), 0)
                  FROM product_batches pb
                 WHERE pb.product_id = p.id AND pb.status = 'active') <= p.minimum_stock) AS low_stock,
       (SELECT COUNT(*)
          FROM products p
         WHERE p.status = 'active'
           AND (SELECT COALESCE(SUM(pb.available_quantity), 0)
                  FROM product_batches pb
                 WHERE pb.product_id = p.id AND pb.status = 'active') = 0) AS out_of_stock,
       (SELECT COUNT(*)
          FROM products p
         WHERE p.status = 'active'
           AND (SELECT COALESCE(SUM(pb.available_quantity), 0)
                  FROM product_batches pb
                 WHERE pb.product_id = p.id AND pb.status = 'active') > 0) AS in_stock,
       (SELECT COUNT(DISTINCT st.id)
          FROM stock_transactions st
          JOIN stock_transaction_items sti ON sti.stock_transaction_id = st.id
         WHERE st.transaction_type = 'stock_in'
           AND st.status = 'completed'
           AND st.transaction_date = CURDATE()) AS stock_in_today,
       (SELECT COUNT(DISTINCT st.id)
          FROM stock_transactions st
          JOIN stock_transaction_items sti ON sti.stock_transaction_id = st.id
         WHERE st.transaction_type = 'stock_out'
           AND st.status = 'completed'
           AND st.transaction_date = CURDATE()) AS stock_out_today,
       (SELECT COUNT(*)
          FROM product_batches pb
          JOIN products p ON p.id = pb.product_id
         WHERE p.status = 'active'
           AND pb.status = 'active'
           AND pb.available_quantity > 0
           AND pb.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)) AS near_expiry,
       (SELECT COUNT(*)
          FROM product_batches pb
          JOIN products p ON p.id = pb.product_id
         WHERE p.status = 'active'
           AND pb.status = 'active'
           AND pb.available_quantity > 0
           AND pb.expiry_date < CURDATE()) AS expired_products,
       (SELECT COUNT(*) FROM suppliers s WHERE s.status = 'active') AS total_suppliers,
       (SELECT COUNT(*) FROM categories c WHERE c.status = 'active') AS total_categories,
       (SELECT COUNT(*) FROM users u WHERE u.status = 'active') AS total_users`
  );
  return rows[0] || {};
};

const loadStockInOutChart = async () => {
  const rows = await query(
    `SELECT
       DATE_FORMAT(st.transaction_date, '%Y-%m') AS ym,
       DATE_FORMAT(st.transaction_date, '%b %Y') AS month,
       SUM(CASE WHEN st.transaction_type = 'stock_in' THEN sti.quantity ELSE 0 END) AS stock_in,
       SUM(CASE WHEN st.transaction_type = 'stock_out' THEN sti.quantity ELSE 0 END) AS stock_out
     FROM stock_transactions st
     JOIN stock_transaction_items sti ON sti.stock_transaction_id = st.id
     WHERE st.transaction_date >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 5 MONTH), '%Y-%m-01')
       AND st.status = 'completed'
     GROUP BY ym, month
     ORDER BY ym ASC`
  );

  const totalsByMonth = new Map(rows.map((row) => [row.ym, row]));
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    const ym = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const existing = totalsByMonth.get(ym);
    return {
      ym,
      month: date.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
      stock_in: Number(existing?.stock_in || 0),
      stock_out: Number(existing?.stock_out || 0),
    };
  });
};

// GET /api/dashboard -> complete dashboard payload in one request
const getOverview = asyncHandler(async (req, res) => {
  const [summary, stock_in_out_chart] = await Promise.all([loadSummary(), loadStockInOutChart()]);
  return ok(res, { summary, stock_in_out_chart });
});

// GET /api/dashboard/summary  -> feeds the dashboard stat cards
const getSummary = asyncHandler(async (req, res) => {
  return ok(res, await loadSummary());
});

// GET /api/dashboard/stock-in-out-chart
// -> monthly totals for the last 6 months, feeds the Stock In/Out bar chart
const getStockInOutChart = asyncHandler(async (req, res) => {
  return ok(res, await loadStockInOutChart());
});

module.exports = { getOverview, getSummary, getStockInOutChart };
