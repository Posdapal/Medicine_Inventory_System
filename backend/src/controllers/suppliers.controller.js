const { query, ok, fail, asyncHandler } = require('../utils/helper');

// GET /api/suppliers?search=
const getAll = asyncHandler(async (req, res) => {
  const search = req.query.search ? `%${req.query.search}%` : '%';
  const rows = await query('SELECT * FROM suppliers WHERE name LIKE ? ORDER BY name', [search]);
  return ok(res, rows);
});

// GET /api/suppliers/:id -> items supplied + recent deliveries
const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const supplierRows = await query('SELECT * FROM suppliers WHERE id = ?', [id]);
  if (!supplierRows[0]) return fail(res, 'Supplier not found', 404);

  const medicinesSupplied = await query(
    'SELECT id, name, stock_quantity FROM medicines WHERE supplier_id = ?',
    [id]
  );
  const productsSupplied = await query(
    'SELECT id, name, stock_quantity FROM products WHERE supplier_id = ?',
    [id]
  );
  const recentDeliveries = await query(
    `SELECT * FROM stock_transactions
     WHERE supplier_id = ? AND transaction_type = 'in'
     ORDER BY transaction_date DESC LIMIT 20`,
    [id]
  );

  return ok(res, { ...supplierRows[0], medicinesSupplied, productsSupplied, recentDeliveries });
});

// POST /api/suppliers
const create = asyncHandler(async (req, res) => {
  const { name, contact_person, phone, email, address, status } = req.body;
  if (!name) return fail(res, 'Supplier name is required', 400);

  const result = await query(
    `INSERT INTO suppliers (name, contact_person, phone, email, address, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, contact_person || null, phone || null, email || null, address || null, status || 'active']
  );
  return ok(res, { id: result.insertId }, 'Supplier created', 201);
});

// PUT /api/suppliers/:id
const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, contact_person, phone, email, address, status } = req.body;
  await query(
    `UPDATE suppliers SET name=?, contact_person=?, phone=?, email=?, address=?, status=? WHERE id=?`,
    [name, contact_person, phone, email, address, status, id]
  );
  return ok(res, null, 'Supplier updated');
});

// DELETE /api/suppliers/:id
const remove = asyncHandler(async (req, res) => {
  await query('DELETE FROM suppliers WHERE id = ?', [req.params.id]);
  return ok(res, null, 'Supplier deleted');
});

module.exports = { getAll, getById, create, update, remove };
