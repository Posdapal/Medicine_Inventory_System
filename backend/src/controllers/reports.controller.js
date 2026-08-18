const { query, ok, fail, asyncHandler } = require('../utils/helper');

// Builds the underlying dataset for each report_type, optionally scoped to a date range.
async function buildReportData(report_type, date_range_start, date_range_end) {
  switch (report_type) {
    case 'inventory':
      return query('SELECT * FROM v_products ORDER BY product_name');

    case 'stock_in': {
      const params = [];
      let sql = `
        SELECT st.transaction_number, st.transaction_date, p.product_name AS product,
               s.supplier_name AS supplier, pb.batch_number, sti.quantity, sti.unit_price
        FROM stock_transactions st
        JOIN stock_transaction_items sti ON sti.stock_transaction_id = st.id
        JOIN products p ON p.id = sti.product_id
        JOIN product_batches pb ON pb.id = sti.batch_id
        LEFT JOIN suppliers s ON s.id = st.supplier_id
        WHERE st.transaction_type = 'stock_in'`;
      if (date_range_start) { sql += ' AND st.transaction_date >= ?'; params.push(date_range_start); }
      if (date_range_end) { sql += ' AND st.transaction_date <= ?'; params.push(date_range_end); }
      sql += ' ORDER BY st.transaction_date DESC';
      return query(sql, params);
    }

    case 'stock_out': {
      const params = [];
      let sql = `
        SELECT st.transaction_number, st.transaction_date, p.product_name AS product,
               pb.batch_number, sti.quantity, st.reason
        FROM stock_transactions st
        JOIN stock_transaction_items sti ON sti.stock_transaction_id = st.id
        JOIN products p ON p.id = sti.product_id
        JOIN product_batches pb ON pb.id = sti.batch_id
        WHERE st.transaction_type = 'stock_out'`;
      if (date_range_start) { sql += ' AND st.transaction_date >= ?'; params.push(date_range_start); }
      if (date_range_end) { sql += ' AND st.transaction_date <= ?'; params.push(date_range_end); }
      sql += ' ORDER BY st.transaction_date DESC';
      return query(sql, params);
    }

    case 'stock_movement': {
      const params = [];
      let sql = 'SELECT * FROM v_stock_history WHERE 1=1';
      if (date_range_start) { sql += ' AND date >= ?'; params.push(date_range_start); }
      if (date_range_end) { sql += ' AND date <= ?'; params.push(date_range_end); }
      sql += ' ORDER BY date DESC';
      return query(sql, params);
    }

    case 'low_stock':
      return query('SELECT * FROM v_current_stock WHERE available_quantity <= minimum_stock ORDER BY available_quantity ASC');

    case 'near_expiry':
      return query('SELECT * FROM v_near_expiry ORDER BY expiry_date ASC');

    default:
      return [];
  }
}

// GET /api/reports/generate?report_type=&date_range_start=&date_range_end=
const generate = asyncHandler(async (req, res) => {
  const { report_type, date_range_start, date_range_end } = req.query;
  const validTypes = ['inventory', 'stock_in', 'stock_out', 'stock_movement', 'low_stock', 'near_expiry'];
  if (!validTypes.includes(report_type)) return fail(res, 'Invalid report_type', 400);

  const data = await buildReportData(report_type, date_range_start, date_range_end);
  return ok(res, { report_type, date_range_start: date_range_start || null, date_range_end: date_range_end || null, data });
});

// GET /api/reports
const getAll = asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT r.*, u.full_name AS generated_by_name
     FROM reports r
     LEFT JOIN users u ON u.id = r.generated_by
     ORDER BY r.created_at DESC`
  );
  return ok(res, rows);
});

// GET /api/reports/:id
const getById = asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT r.*, u.full_name AS generated_by_name
     FROM reports r
     LEFT JOIN users u ON u.id = r.generated_by
     WHERE r.id = ?`,
    [req.params.id]
  );
  if (!rows[0]) return fail(res, 'Report not found', 404);
  return ok(res, rows[0]);
});

// POST /api/reports  -> save a generated report as a snapshot
const save = asyncHandler(async (req, res) => {
  const { title, report_type, date_range_start, date_range_end, data_snapshot } = req.body;
  if (!title || !report_type) return fail(res, 'Title and report_type are required', 400);

  const result = await query(
    `INSERT INTO reports (title, report_type, date_range_start, date_range_end, generated_by, data_snapshot)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [title, report_type, date_range_start || null, date_range_end || null, req.user?.id || null, JSON.stringify(data_snapshot || [])]
  );
  return ok(res, { id: result.insertId }, 'Report saved', 201);
});

module.exports = { generate, getAll, getById, save };
