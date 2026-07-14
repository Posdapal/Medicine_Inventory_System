const { query, ok, fail, asyncHandler } = require('../utils/helper');

// GET /api/categories?type=medicine|product
const getAll = asyncHandler(async (req, res) => {
  const { type } = req.query;
  const table = type === 'product' ? 'products' : 'medicines';

  const params = [];
  let sql = `
    SELECT c.*, COUNT(t.id) AS item_count
    FROM categories c
    LEFT JOIN ${table} t ON t.category_id = c.id
  `;
  if (type) {
    sql += ' WHERE c.type = ?';
    params.push(type);
  }
  sql += ' GROUP BY c.id ORDER BY c.name';

  const rows = await query(sql, params);
  return ok(res, rows);
});

// POST /api/categories
const create = asyncHandler(async (req, res) => {
  const { name, type, description } = req.body;
  if (!name || !type) return fail(res, 'Name and type are required', 400);

  const result = await query(
    'INSERT INTO categories (name, type, description) VALUES (?, ?, ?)',
    [name, type, description || null]
  );
  return ok(res, { id: result.insertId }, 'Category created', 201);
});

// PUT /api/categories/:id
const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, type, description } = req.body;
  await query('UPDATE categories SET name=?, type=?, description=? WHERE id=?', [name, type, description, id]);
  return ok(res, null, 'Category updated');
});

// DELETE /api/categories/:id
const remove = asyncHandler(async (req, res) => {
  await query('DELETE FROM categories WHERE id = ?', [req.params.id]);
  return ok(res, null, 'Category deleted');
});

module.exports = { getAll, create, update, remove };
