const { query, ok, fail, asyncHandler } = require('../utils/helper');

const BASE_SELECT = `
  SELECT m.*, c.name AS category_name, s.name AS supplier_name
  FROM medicines m
  JOIN categories c ON c.id = m.category_id
  LEFT JOIN suppliers s ON s.id = m.supplier_id
`;

// GET /api/medicines?search=&category_id=&low_stock=true
const getAll = asyncHandler(async (req, res) => {
  const { search, category_id, low_stock } = req.query;
  const conditions = [];
  const params = [];

  if (search) { conditions.push('m.name LIKE ?'); params.push(`%${search}%`); }
  if (category_id) { conditions.push('m.category_id = ?'); params.push(category_id); }
  if (low_stock === 'true') { conditions.push('m.stock_quantity <= m.reorder_level'); }

  let sql = BASE_SELECT;
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY m.name';

  const rows = await query(sql, params);
  return ok(res, rows);
});

// GET /api/medicines/:id
const getById = asyncHandler(async (req, res) => {
  const rows = await query(`${BASE_SELECT} WHERE m.id = ?`, [req.params.id]);
  if (!rows[0]) return fail(res, 'Medicine not found', 404);
  return ok(res, rows[0]);
});

// GET /api/medicines/:id/stock-history
const getStockHistory = asyncHandler(async (req, res) => {
  const rows = await query(
    'SELECT * FROM stock_transactions WHERE medicine_id = ? ORDER BY transaction_date DESC',
    [req.params.id]
  );
  return ok(res, rows);
});

// POST /api/medicines
const create = asyncHandler(async (req, res) => {
  const { name, category_id, supplier_id, unit, price, stock_quantity, reorder_level, expiry_date, description } = req.body;
  if (!name || !category_id) return fail(res, 'Name and category are required', 400);

  const result = await query(
    `INSERT INTO medicines (name, category_id, supplier_id, unit, price, stock_quantity, reorder_level, expiry_date, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name, category_id, supplier_id || null, unit || 'unit', price || 0,
      stock_quantity || 0, reorder_level || 10, expiry_date || null, description || null,
    ]
  );
  return ok(res, { id: result.insertId }, 'Medicine created', 201);
});

// PUT /api/medicines/:id
const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, category_id, supplier_id, unit, price, stock_quantity, reorder_level, expiry_date, description } = req.body;
  await query(
    `UPDATE medicines
     SET name=?, category_id=?, supplier_id=?, unit=?, price=?, stock_quantity=?, reorder_level=?, expiry_date=?, description=?
     WHERE id=?`,
    [name, category_id, supplier_id, unit, price, stock_quantity, reorder_level, expiry_date, description, id]
  );
  return ok(res, null, 'Medicine updated');
});

// DELETE /api/medicines/:id
const remove = asyncHandler(async (req, res) => {
  await query('DELETE FROM medicines WHERE id = ?', [req.params.id]);
  return ok(res, null, 'Medicine deleted');
});

module.exports = { getAll, getById, create, update, remove, getStockHistory };
