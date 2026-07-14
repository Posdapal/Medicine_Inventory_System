const bcrypt = require('bcryptjs');
const { query, ok, fail, asyncHandler } = require('../utils/helper');

// GET /api/users?search=
const getAll = asyncHandler(async (req, res) => {
  const search = req.query.search ? `%${req.query.search}%` : '%';
  const rows = await query(
    `SELECT id, full_name, username, email, phone, role, status, created_at
     FROM users WHERE full_name LIKE ? ORDER BY full_name`,
    [search]
  );
  return ok(res, rows);
});

// GET /api/users/:id
const getById = asyncHandler(async (req, res) => {
  const rows = await query(
    'SELECT id, full_name, username, email, phone, role, status FROM users WHERE id = ?',
    [req.params.id]
  );
  if (!rows[0]) return fail(res, 'User not found', 404);
  return ok(res, rows[0]);
});

// POST /api/users
const create = asyncHandler(async (req, res) => {
  const { full_name, username, email, password, phone, role } = req.body;
  if (!full_name || !username || !email || !password) {
    return fail(res, 'Full name, username, email and password are required', 400);
  }

  const hashed = await bcrypt.hash(password, 10);
  const result = await query(
    `INSERT INTO users (full_name, username, email, password, phone, role)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [full_name, username, email, hashed, phone || null, role || 'user']
  );
  // Every user gets a matching settings row (1-to-1 relationship)
  await query('INSERT INTO user_settings (user_id) VALUES (?)', [result.insertId]);

  return ok(res, { id: result.insertId }, 'User created', 201);
});

// PUT /api/users/:id
const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { full_name, username, email, phone, role, status } = req.body;
  await query(
    `UPDATE users SET full_name=?, username=?, email=?, phone=?, role=?, status=? WHERE id=?`,
    [full_name, username, email, phone, role, status, id]
  );
  return ok(res, null, 'User updated');
});

// DELETE /api/users/:id
const remove = asyncHandler(async (req, res) => {
  await query('DELETE FROM users WHERE id = ?', [req.params.id]);
  return ok(res, null, 'User deleted');
});

module.exports = { getAll, getById, create, update, remove };
