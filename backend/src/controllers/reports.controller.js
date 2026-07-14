const { query, ok, fail, asyncHandler } = require('../utils/helper');

// GET /api/reports/generate?report_type=&date_range_start=&date_range_end=
const generate = asyncHandler(async (req, res) => {
  const { report_type, date_range_start, date_range_end } = req.query;

  let data;
  if (report_type === 'medicine_usage') {
    data = await query('SELECT * FROM v_monthly_usage');
  } else if (report_type === 'medicine_stock') {
    data = await query('SELECT * FROM v_stock_by_category');
  } else if (report_type === 'patients') {
    data = await query('SELECT * FROM patients ORDER BY created_at DESC');
  } else if (report_type === 'suppliers') {
    data = await query('SELECT * FROM suppliers ORDER BY name');
  } else if (report_type === 'products') {
    data = await query('SELECT * FROM products ORDER BY name');
  } else {
    return fail(res, 'Unsupported report type', 400);
  }

  return ok(res, { report_type, date_range_start, date_range_end, data });
});

// POST /api/reports -> save a generated report as a snapshot
const save = asyncHandler(async (req, res) => {
  const { title, report_type, date_range_start, date_range_end, data_snapshot } = req.body;
  if (!title || !report_type) return fail(res, 'Title and report type are required', 400);

  const result = await query(
    `INSERT INTO reports (title, report_type, date_range_start, date_range_end, generated_by, data_snapshot)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [title, report_type, date_range_start || null, date_range_end || null, req.user.id, JSON.stringify(data_snapshot || {})]
  );
  return ok(res, { id: result.insertId }, 'Report saved', 201);
});

// GET /api/reports -> list saved reports
const getAll = asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT r.id, r.title, r.report_type, r.date_range_start, r.date_range_end, r.created_at,
            u.full_name AS generated_by_name
     FROM reports r
     JOIN users u ON u.id = r.generated_by
     ORDER BY r.created_at DESC`
  );
  return ok(res, rows);
});

// GET /api/reports/:id -> reload a saved snapshot instantly
const getById = asyncHandler(async (req, res) => {
  const rows = await query('SELECT * FROM reports WHERE id = ?', [req.params.id]);
  if (!rows[0]) return fail(res, 'Report not found', 404);
  return ok(res, rows[0]);
});

module.exports = { generate, save, getAll, getById };
