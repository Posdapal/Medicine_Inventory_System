const { query, queryPage, ok, fail, asyncHandler } = require('../utils/helper');

// GET /api/categories?search=
const getAll = asyncHandler(async (req, res) => {
  const search = req.query.search ? `%${req.query.search}%` : '%';
  const statusFilter = req.query.status ? ' AND status = ?' : '';
  const params = req.query.status ? [search, req.query.status] : [search];
  const rows = await queryPage(req, `SELECT * FROM categories WHERE name LIKE ?${statusFilter}`, params, 'ORDER BY name');
  return ok(res, rows);
});

// POST /api/categories
const create = asyncHandler(async (req, res) => {
  const { name, description, status } = req.body;
  if (!name) return fail(res, 'Category name is required', 400);

  const result = await query(
    'INSERT INTO categories (name, description, status) VALUES (?, ?, ?)',
    [name, description || null, status || 'active']
  );
  return ok(res, { id: result.insertId }, 'Category created', 201);
});

// PUT /api/categories/:id
const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, status } = req.body;
  if (!name) return fail(res, 'Category name is required', 400);

  await query(
    'UPDATE categories SET name=?, description=?, status=? WHERE id=?',
    [name, description || null, status || 'active', id]
  );
  return ok(res, null, 'Category updated');
});

// DELETE /api/categories/:id
const remove = asyncHandler(async (req, res) => {
  await query('DELETE FROM categories WHERE id = ?', [req.params.id]);
  return ok(res, null, 'Category deleted');
});

module.exports = { getAll, create, update, remove };
