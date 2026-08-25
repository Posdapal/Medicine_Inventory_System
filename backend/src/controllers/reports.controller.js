const { query, queryPage, ok, fail, asyncHandler } = require('../utils/helper');

// Builds the underlying dataset for each report_type, optionally scoped to a date range.
async function buildReportData(report_type, date_range_start, date_range_end) {
  const withDateRange = (sql, column, params = [], timestampColumn = false) => {
    if (date_range_start) { sql += ` AND ${column} >= ?`; params.push(date_range_start); }
    if (date_range_end) {
      sql += timestampColumn ? ` AND ${column} < DATE_ADD(?, INTERVAL 1 DAY)` : ` AND ${column} <= ?`;
      params.push(date_range_end);
    }
    return { sql, params };
  };

  switch (report_type) {
    case 'products':
    case 'inventory': {
      const result = withDateRange(
        `SELECT p.product_code, p.product_name, p.generic_name, c.name AS category,
                u.name AS unit, p.minimum_stock, p.status, DATE(p.created_at) AS created_date
           FROM products p
           LEFT JOIN categories c ON c.id = p.category_id
           LEFT JOIN units u ON u.id = p.unit_id
          WHERE 1=1`, 'p.created_at', [], true
      );
      return query(`${result.sql} ORDER BY p.product_name`, result.params);
    }

    case 'categories': {
      const result = withDateRange('SELECT name, description, status, DATE(created_at) AS created_date FROM categories WHERE 1=1', 'created_at', [], true);
      return query(`${result.sql} ORDER BY name`, result.params);
    }

    case 'units': {
      const result = withDateRange('SELECT name, abbreviation, DATE(created_at) AS created_date FROM units WHERE 1=1', 'created_at', [], true);
      return query(`${result.sql} ORDER BY name`, result.params);
    }

    case 'suppliers': {
      const result = withDateRange('SELECT supplier_code, supplier_name, contact_name, phone, email, address, status, DATE(created_at) AS created_date FROM suppliers WHERE 1=1', 'created_at', [], true);
      return query(`${result.sql} ORDER BY supplier_name`, result.params);
    }

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
        WHERE st.transaction_type = 'stock_in' AND st.status = 'completed'`;
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
        WHERE st.transaction_type = 'stock_out' AND st.status = 'completed'`;
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

    case 'current_stock':
    case 'low_stock': {
      const params = [];
      let sql = `SELECT p.product_code, p.product_name, c.name AS category, u.name AS unit,
                        COALESCE(SUM(CASE WHEN pb.status = 'active' THEN pb.available_quantity ELSE 0 END), 0) AS available_quantity,
                        p.minimum_stock,
                        CASE WHEN COALESCE(SUM(CASE WHEN pb.status = 'active' THEN pb.available_quantity ELSE 0 END), 0) = 0 THEN 'Out of Stock'
                             WHEN COALESCE(SUM(CASE WHEN pb.status = 'active' THEN pb.available_quantity ELSE 0 END), 0) <= p.minimum_stock THEN 'Low Stock'
                             ELSE 'In Stock' END AS stock_status
                   FROM products p
                   LEFT JOIN categories c ON c.id = p.category_id
                   LEFT JOIN units u ON u.id = p.unit_id
                   LEFT JOIN product_batches pb ON pb.product_id = p.id
                  WHERE p.status = 'active'`;
      if (date_range_start) { sql += ' AND p.created_at >= ?'; params.push(date_range_start); }
      if (date_range_end) { sql += ' AND p.created_at < DATE_ADD(?, INTERVAL 1 DAY)'; params.push(date_range_end); }
      sql += ' GROUP BY p.id, p.product_code, p.product_name, c.name, u.name, p.minimum_stock';
      if (report_type === 'low_stock') sql += ' HAVING available_quantity > 0 AND available_quantity <= p.minimum_stock';
      sql += ' ORDER BY available_quantity ASC, p.product_name';
      return query(sql, params);
    }

    case 'near_expiry': {
      const result = withDateRange(
        `SELECT p.product_name AS product, pb.batch_number, pb.manufacture_date, pb.expiry_date,
                DATEDIFF(pb.expiry_date, CURDATE()) AS days_remaining, pb.available_quantity
           FROM product_batches pb JOIN products p ON p.id = pb.product_id
          WHERE p.status = 'active' AND pb.status = 'active' AND pb.available_quantity > 0
            AND pb.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)`, 'pb.expiry_date'
      );
      return query(`${result.sql} ORDER BY pb.expiry_date ASC`, result.params);
    }

    case 'expired_products': {
      const result = withDateRange(
        `SELECT p.product_name AS product, pb.batch_number, pb.manufacture_date, pb.expiry_date,
                DATEDIFF(CURDATE(), pb.expiry_date) AS days_expired, pb.available_quantity
           FROM product_batches pb JOIN products p ON p.id = pb.product_id
          WHERE p.status = 'active' AND pb.status = 'active' AND pb.available_quantity > 0
            AND pb.expiry_date < CURDATE()`, 'pb.expiry_date'
      );
      return query(`${result.sql} ORDER BY pb.expiry_date DESC`, result.params);
    }

    case 'users': {
      const result = withDateRange(
        `SELECT u.full_name, u.username, u.email, r.name AS role, u.status, DATE(u.created_at) AS created_date
           FROM users u JOIN roles r ON r.id = u.role_id WHERE 1=1`, 'u.created_at', [], true
      );
      return query(`${result.sql} ORDER BY u.full_name`, result.params);
    }

    default:
      return [];
  }
}

// GET /api/reports/generate?report_type=&date_range_start=&date_range_end=
const generate = asyncHandler(async (req, res) => {
  const { report_type, date_range_start, date_range_end } = req.query;
  const validTypes = ['products', 'inventory', 'categories', 'units', 'suppliers', 'stock_in', 'stock_out', 'current_stock', 'stock_movement', 'low_stock', 'near_expiry', 'expired_products', 'users'];
  if (!validTypes.includes(report_type)) return fail(res, 'Invalid report_type', 400);
  const validDate = (value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value);
  if (!validDate(date_range_start) || !validDate(date_range_end)) {
    return fail(res, 'Dates must use YYYY-MM-DD format', 400);
  }
  if (date_range_start && date_range_end && date_range_start > date_range_end) {
    return fail(res, 'From date must be before or equal to To date', 400);
  }

  const data = await buildReportData(report_type, date_range_start, date_range_end);
  return ok(res, { report_type, date_range_start: date_range_start || null, date_range_end: date_range_end || null, data });
});

// GET /api/reports
const getAll = asyncHandler(async (req, res) => {
  const rows = await queryPage(req,
    `SELECT r.*, u.full_name AS generated_by_name
     FROM reports r
     LEFT JOIN users u ON u.id = r.generated_by`, [], 'ORDER BY r.created_at DESC'
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

module.exports = { generate, getAll, getById, save, buildReportData };
