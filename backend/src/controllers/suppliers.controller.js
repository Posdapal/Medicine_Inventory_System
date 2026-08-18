const { query, ok, fail, asyncHandler } = require('../utils/helper');

// GET /api/suppliers?search=
const getAll = asyncHandler(async (req, res) => {
  const search = req.query.search ? `%${req.query.search}%` : '%';
  const rows = await query(
    'SELECT * FROM suppliers WHERE supplier_name LIKE ? OR supplier_code LIKE ? ORDER BY supplier_name',
    [search, search]
  );
  return ok(res, rows);
});

// GET /api/suppliers/:id -> supplier + recent deliveries (stock-in transactions)
const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const supplierRows = await query('SELECT * FROM suppliers WHERE id = ?', [id]);
  if (!supplierRows[0]) return fail(res, 'Supplier not found', 404);

  const recentDeliveries = await query(
    `SELECT st.id, st.transaction_number, st.transaction_date, st.reference_number,
            p.product_name, sti.quantity, sti.unit_price
     FROM stock_transactions st
     JOIN stock_transaction_items sti ON sti.stock_transaction_id = st.id
     JOIN products p ON p.id = sti.product_id
     WHERE st.supplier_id = ? AND st.transaction_type = 'stock_in'
     ORDER BY st.transaction_date DESC
     LIMIT 20`,
    [id]
  );

  return ok(res, { ...supplierRows[0], recentDeliveries });
});

// POST /api/suppliers
const create = asyncHandler(async (req, res) => {
  const { supplier_code, supplier_name, contact_name, phone, email, address, status } = req.body;
  if (!supplier_code || !supplier_name) return fail(res, 'Supplier code and name are required', 400);

  const result = await query(
    `INSERT INTO suppliers (supplier_code, supplier_name, contact_name, phone, email, address, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [supplier_code, supplier_name, contact_name || null, phone || null, email || null, address || null, status || 'active']
  );
  return ok(res, { id: result.insertId }, 'Supplier created', 201);
});

// PUT /api/suppliers/:id
const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { supplier_code, supplier_name, contact_name, phone, email, address, status } = req.body;
  if (!supplier_code || !supplier_name) return fail(res, 'Supplier code and name are required', 400);

  await query(
    `UPDATE suppliers SET supplier_code=?, supplier_name=?, contact_name=?, phone=?, email=?, address=?, status=? WHERE id=?`,
    [supplier_code, supplier_name, contact_name || null, phone || null, email || null, address || null, status || 'active', id]
  );
  return ok(res, null, 'Supplier updated');
});

// DELETE /api/suppliers/:id
const remove = asyncHandler(async (req, res) => {
  await query('DELETE FROM suppliers WHERE id = ?', [req.params.id]);
  return ok(res, null, 'Supplier deleted');
});

module.exports = { getAll, getById, create, update, remove };
