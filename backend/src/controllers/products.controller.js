const { query, ok, fail, asyncHandler } = require('../utils/helper');

const BASE_SELECT = `
  SELECT p.*, c.name AS category_name, s.name AS supplier_name
  FROM products p
  JOIN categories c ON c.id = p.category_id
  LEFT JOIN suppliers s ON s.id = p.supplier_id
`;

// GET /api/products?search=&category_id=&low_stock=true
const getAll = asyncHandler(async (req, res) => {
  const { search, category_id, low_stock } = req.query;
  const conditions = [];
  const params = [];

  if (search) { conditions.push('p.name LIKE ?'); params.push(`%${search}%`); }
  if (category_id) { conditions.push('p.category_id = ?'); params.push(category_id); }
  if (low_stock === 'true') { conditions.push('p.stock_quantity <= p.reorder_level'); }

  let sql = BASE_SELECT;
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY p.name';

  const rows = await query(sql, params);
  return ok(res, rows);
});

// GET /api/products/:id
const getById = asyncHandler(async (req, res) => {
  const rows = await query(`${BASE_SELECT} WHERE p.id = ?`, [req.params.id]);
  if (!rows[0]) return fail(res, 'Product not found', 404);
  return ok(res, rows[0]);
});

// POST /api/products
const create = asyncHandler(async (req, res) => {
  const { name, sku, category_id, supplier_id, unit, price, stock_quantity, reorder_level, description } = req.body;
  if (!name || !category_id) return fail(res, 'Name and category are required', 400);

  const result = await query(
    `INSERT INTO products (name, sku, category_id, supplier_id, unit, price, stock_quantity, reorder_level, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name, sku || null, category_id, supplier_id || null, unit || 'unit', price || 0,
      stock_quantity || 0, reorder_level || 10, description || null,
    ]
  );
  return ok(res, { id: result.insertId }, 'Product created', 201);
});

// PUT /api/products/:id
const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, sku, category_id, supplier_id, unit, price, stock_quantity, reorder_level, description } = req.body;
  await query(
    `UPDATE products
     SET name=?, sku=?, category_id=?, supplier_id=?, unit=?, price=?, stock_quantity=?, reorder_level=?, description=?
     WHERE id=?`,
    [name, sku, category_id, supplier_id, unit, price, stock_quantity, reorder_level, description, id]
  );
  return ok(res, null, 'Product updated');
});

// DELETE /api/products/:id
const remove = asyncHandler(async (req, res) => {
  await query('DELETE FROM products WHERE id = ?', [req.params.id]);
  return ok(res, null, 'Product deleted');
});

module.exports = { getAll, getById, create, update, remove };
