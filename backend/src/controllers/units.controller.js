const { query, queryPage, ok, fail, asyncHandler } = require('../utils/helper');

const normalize = (value) => String(value || '').trim();

async function unitNameExists(name, excludeId = null) {
  const params = [name];
  let sql = 'SELECT id FROM units WHERE LOWER(TRIM(name)) = LOWER(?)';
  if (excludeId !== null) {
    sql += ' AND id <> ?';
    params.push(excludeId);
  }
  const rows = await query(`${sql} LIMIT 1`, params);
  return rows.length > 0;
}

// GET /api/units?search=
const getAll = asyncHandler(async (req, res) => {
  const search = req.query.search ? `%${req.query.search}%` : '%';
  const rows = await queryPage(req, 'SELECT * FROM units WHERE name LIKE ?', [search], 'ORDER BY name');
  return ok(res, rows);
});

// POST /api/units
const create = asyncHandler(async (req, res) => {
  const { name, abbreviation } = req.body;
  const normalizedName = normalize(name);
  const normalizedAbbreviation = normalize(abbreviation);
  if (!normalizedName) return fail(res, 'Unit name is required', 400);
  if (await unitNameExists(normalizedName)) {
    return fail(res, 'A unit with this name already exists.', 409);
  }

  const result = await query(
    'INSERT INTO units (name, abbreviation) VALUES (?, ?)',
    [normalizedName, normalizedAbbreviation || null]
  );
  return ok(res, { id: result.insertId }, 'Unit created', 201);
});

// PUT /api/units/:id
const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, abbreviation } = req.body;
  const normalizedName = normalize(name);
  const normalizedAbbreviation = normalize(abbreviation);
  if (!normalizedName) return fail(res, 'Unit name is required', 400);
  if (await unitNameExists(normalizedName, id)) {
    return fail(res, 'A unit with this name already exists.', 409);
  }

  await query('UPDATE units SET name=?, abbreviation=? WHERE id=?', [normalizedName, normalizedAbbreviation || null, id]);
  return ok(res, null, 'Unit updated');
});

// DELETE /api/units/:id
const remove = asyncHandler(async (req, res) => {
  await query('DELETE FROM units WHERE id = ?', [req.params.id]);
  return ok(res, null, 'Unit deleted');
});

module.exports = { getAll, create, update, remove };
