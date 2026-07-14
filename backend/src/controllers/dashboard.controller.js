const { query, ok, asyncHandler } = require('../utils/helper');

// GET /api/dashboard/summary  -> feeds the 4 dashboard cards
const getSummary = asyncHandler(async (req, res) => {
  const rows = await query('SELECT * FROM v_dashboard_summary');
  return ok(res, rows[0]);
});

// GET /api/dashboard/usage-chart -> Medicine Usage Report line chart
const getUsageChart = asyncHandler(async (req, res) => {
  const rows = await query('SELECT * FROM v_monthly_usage');
  return ok(res, rows);
});

// GET /api/dashboard/stock-chart -> Medicine Stock Report bar chart
const getStockChart = asyncHandler(async (req, res) => {
  const rows = await query('SELECT * FROM v_stock_by_category');
  return ok(res, rows);
});

// GET /api/dashboard/low-stock -> drill-down behind the Low Stock card
const getLowStock = asyncHandler(async (req, res) => {
  const medicines = await query('SELECT * FROM v_low_stock_medicines');
  const products = await query('SELECT * FROM v_low_stock_products');
  return ok(res, { medicines, products });
});

module.exports = { getSummary, getUsageChart, getStockChart, getLowStock };
