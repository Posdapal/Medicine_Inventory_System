const { query, ok, asyncHandler } = require('../utils/helper');

// GET /api/dashboard/summary  -> feeds the dashboard stat cards
const getSummary = asyncHandler(async (req, res) => {
  const rows = await query('SELECT * FROM v_dashboard_summary');
  return ok(res, rows[0]);
});

// GET /api/dashboard/stock-in-out-chart
// -> monthly totals for the last 6 months, feeds the Stock In/Out bar chart
const getStockInOutChart = asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT
       DATE_FORMAT(st.transaction_date, '%Y-%m') AS ym,
       DATE_FORMAT(st.transaction_date, '%b %Y') AS month,
       SUM(CASE WHEN st.transaction_type = 'stock_in' THEN sti.quantity ELSE 0 END) AS stock_in,
       SUM(CASE WHEN st.transaction_type = 'stock_out' THEN sti.quantity ELSE 0 END) AS stock_out
     FROM stock_transactions st
     JOIN stock_transaction_items sti ON sti.stock_transaction_id = st.id
     WHERE st.transaction_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
     GROUP BY ym, month
     ORDER BY ym ASC`
  );
  return ok(res, rows);
});

module.exports = { getSummary, getStockInOutChart };
