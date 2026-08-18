const { query, ok, fail, asyncHandler } = require('../utils/helper');

// GET /api/products?search=&category_id=&status=
const getAll = asyncHandler(async (req, res) => {
  const { search, category_id, status } = req.query;
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push('(product_name LIKE ? OR product_code LIKE ? OR generic_name LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (category_id) { conditions.push('category_id = ?'); params.push(category_id); }
  if (status) { conditions.push('status = ?'); params.push(status); }

  let sql = 'SELECT * FROM v_products';
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY product_name';

  const rows = await query(sql, params);
  return ok(res, rows);
});

// GET /api/products/:id  (includes its batches)
const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const rows = await query('SELECT * FROM v_products WHERE id = ?', [id]);
  if (!rows[0]) return fail(res, 'Product not found', 404);

  const batches = await query(
    'SELECT * FROM product_batches WHERE product_id = ? ORDER BY expiry_date IS NULL, expiry_date ASC',
    [id]
  );
  return ok(res, { ...rows[0], batches });
});

// POST /api/products
const create = asyncHandler(async (req, res) => {
  const { product_code, product_name, generic_name, category_id, unit_id, minimum_stock, status } = req.body;
  if (!product_code || !product_name) return fail(res, 'Product code and product name are required', 400);

  const result = await query(
    `INSERT INTO products (category_id, unit_id, product_code, product_name, generic_name, minimum_stock, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      category_id || null, unit_id || null, product_code, product_name,
      generic_name || null, minimum_stock || 0, status || 'active',
    ]
  );
  return ok(res, { id: result.insertId }, 'Product created', 201);
});

// PUT /api/products/:id
const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { product_code, product_name, generic_name, category_id, unit_id, minimum_stock, status } = req.body;
  if (!product_code || !product_name) return fail(res, 'Product code and product name are required', 400);

  await query(
    `UPDATE products
     SET category_id=?, unit_id=?, product_code=?, product_name=?, generic_name=?, minimum_stock=?, status=?
     WHERE id=?`,
    [category_id || null, unit_id || null, product_code, product_name, generic_name || null, minimum_stock || 0, status || 'active', id]
  );
  return ok(res, null, 'Product updated');
});

// DELETE /api/products/:id
const remove = asyncHandler(async (req, res) => {
  await query('DELETE FROM products WHERE id = ?', [req.params.id]);
  return ok(res, null, 'Product deleted');
});

module.exports = { getAll, getById, create, update, remove };
