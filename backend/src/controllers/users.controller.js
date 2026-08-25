const bcrypt = require('bcryptjs');
const { query, queryPage, ok, fail, asyncHandler } = require('../utils/helper');

// GET /api/users?search=
const getAll = asyncHandler(async (req, res) => {
  const search = req.query.search ? `%${req.query.search}%` : '%';
  const statusFilter = req.query.status ? ' AND u.status = ?' : '';
  const params = req.query.status ? [search, req.query.status] : [search];
  const rows = await queryPage(req,
    `SELECT u.id, u.full_name, u.username, u.email, r.name AS role, u.status, u.created_at
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.full_name LIKE ?${statusFilter}`,
    params, 'ORDER BY u.full_name'
  );
  return ok(res, rows);
});

// GET /api/users/:id
const getById = asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT u.id, u.full_name, u.username, u.email, r.name AS role, u.status
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = ?`,
    [req.params.id]
  );
  if (!rows[0]) return fail(res, 'User not found', 404);
  return ok(res, rows[0]);
});

// POST /api/users
// body: { full_name, username, email, password, role } -- role is a NAME, e.g. "Staff" or "Administrator"
const create = asyncHandler(async (req, res) => {
  const { full_name, username, email, password, role } = req.body;
  if (!full_name || !username || !email || !password) {
    return fail(res, 'Full name, username, email and password are required', 400);
  }

  // Resolve role name -> role_id. Defaults to "Staff" if not provided.
  const roleName = role || 'Staff';
  const roleRows = await query('SELECT id FROM roles WHERE name = ?', [roleName]);
  if (!roleRows[0]) return fail(res, `Unknown role "${roleName}"`, 400);

  const hashed = await bcrypt.hash(password, 10);
  const result = await query(
    `INSERT INTO users (role_id, full_name, username, email, password)
     VALUES (?, ?, ?, ?, ?)`,
    [roleRows[0].id, full_name, username, email, hashed]
  );

  return ok(res, { id: result.insertId }, 'User created', 201);
});

// PUT /api/users/:id
// body: { full_name, username, email, role, status } -- role is a NAME
const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { full_name, username, email, role, status } = req.body;

  let role_id;
  if (role) {
    const roleRows = await query('SELECT id FROM roles WHERE name = ?', [role]);
    if (!roleRows[0]) return fail(res, `Unknown role "${role}"`, 400);
    role_id = roleRows[0].id;
  } else {
    const existing = await query('SELECT role_id FROM users WHERE id = ?', [id]);
    if (!existing[0]) return fail(res, 'User not found', 404);
    role_id = existing[0].role_id;
  }

  await query(
    `UPDATE users SET full_name=?, username=?, email=?, role_id=?, status=? WHERE id=?`,
    [full_name, username, email, role_id, status, id]
  );
  return ok(res, null, 'User updated');
});

// DELETE /api/users/:id
const remove = asyncHandler(async (req, res) => {
  await query('DELETE FROM users WHERE id = ?', [req.params.id]);
  return ok(res, null, 'User deleted');
});

module.exports = { getAll, getById, create, update, remove };
