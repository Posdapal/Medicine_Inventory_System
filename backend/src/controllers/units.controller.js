const { query, queryPage, ok, fail, asyncHandler } = require('../utils/helper');

// GET /api/units?search=
const getAll = asyncHandler(async (req, res) => {
  const search = req.query.search ? `%${req.query.search}%` : '%';
  const rows = await queryPage(req, 'SELECT * FROM units WHERE name LIKE ?', [search], 'ORDER BY name');
  return ok(res, rows);
});

// POST /api/units
const create = asyncHandler(async (req, res) => {
  const { name, abbreviation } = req.body;
  if (!name) return fail(res, 'Unit name is required', 400);

  const result = await query(
    'INSERT INTO units (name, abbreviation) VALUES (?, ?)',
    [name, abbreviation || null]
  );
  return ok(res, { id: result.insertId }, 'Unit created', 201);
});

// PUT /api/units/:id
const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, abbreviation } = req.body;
  if (!name) return fail(res, 'Unit name is required', 400);

  await query('UPDATE units SET name=?, abbreviation=? WHERE id=?', [name, abbreviation || null, id]);
  return ok(res, null, 'Unit updated');
});

// DELETE /api/units/:id
const remove = asyncHandler(async (req, res) => {
  await query('DELETE FROM units WHERE id = ?', [req.params.id]);
  return ok(res, null, 'Unit deleted');
});

module.exports = { getAll, create, update, remove };
