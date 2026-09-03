const bcrypt = require('bcryptjs');
const { query, queryPage, ok, fail, asyncHandler } = require('../utils/helper');

// GET /api/users?search=
const getAll = asyncHandler(async (req, res) => {
  const search = req.query.search ? `%${req.query.search}%` : '%';
  const statusFilter = req.query.status ? ' AND u.status = ?' : '';
  const params = req.query.status ? [search, req.query.status] : [search];
  const rows = await queryPage(req,
    `SELECT u.id, u.full_name, u.username, u.email, u.role_id, CASE WHEN LOWER(r.name)='staff' THEN 'Stock Staff' ELSE r.name END AS role, u.status, u.created_at
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
    `SELECT u.id, u.full_name, u.username, u.email, u.role_id, CASE WHEN LOWER(r.name)='staff' THEN 'Stock Staff' ELSE r.name END AS role, u.status
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = ?`,
    [req.params.id]
  );
  if (!rows[0]) return fail(res, 'User not found', 404);
  return ok(res, rows[0]);
});

// POST /api/users
// body includes roleId; role IDs are resolved dynamically from active database roles.
const create = asyncHandler(async (req, res) => {
  const { full_name, username, email, password, roleId } = req.body;
  if (!full_name || !username || !email || !password) {
    return fail(res, 'Full name, username, email and password are required', 400);
  }

  // Resolve the submitted dynamic role ID and reject retired/inactive roles.
  if (!roleId) return fail(res, 'An active roleId is required', 400);
  const roleRows = await query("SELECT id FROM roles WHERE id=? AND status='active' AND LOWER(name)<>'staff'", [roleId]);
  if (!roleRows[0]) return fail(res, 'Unknown or inactive role', 400);

  const hashed = await bcrypt.hash(password, 10);
  const result = await query(
    `INSERT INTO users (role_id, full_name, username, email, password)
     VALUES (?, ?, ?, ?, ?)`,
    [roleRows[0].id, full_name, username, email, hashed]
  );

  return ok(res, { id: result.insertId }, 'User created', 201);
});

// PUT /api/users/:id
// body: { full_name, username, email, roleId, status }
const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { full_name, username, email, roleId, status } = req.body;

  let role_id;
  if (roleId) {
    const roleRows = await query("SELECT id FROM roles WHERE id=? AND status='active' AND LOWER(name)<>'staff'", [roleId]);
    if (!roleRows[0]) return fail(res, 'Unknown or inactive role', 400);
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

// GET /api/users/:id/profile
// This is the query that was previously failing with
// ER_NO_SUCH_TABLE 'medicine_inventoryup.user_settings'. It now works because
// migrations/2026_09_03_000001_create_user_settings_table.sql creates the
// table (user_id UNIQUE + FK to users.id) and backfills one row per existing
// user. The LEFT JOIN + COALESCE below is kept anyway so the endpoint stays
// correct even for an edge case where a settings row is somehow missing
// (e.g. a user inserted by a raw script that bypassed `create` below) —
// it degrades to sane defaults instead of throwing or returning NULLs.
// Single query, no follow-up "does settings exist" round trip.
const getProfile = asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT
       u.id, u.full_name, u.username, u.email, u.role_id,
       CASE WHEN LOWER(r.name)='staff' THEN 'Stock Staff' ELSE r.name END AS role,
       u.status,
       s.address,
       s.date_of_birth,
       COALESCE(s.gender, 'unspecified')             AS gender,
       COALESCE(s.theme, 'system')                   AS theme,
       COALESCE(s.language, 'en')                    AS language,
       COALESCE(s.notifications_telegram, 0)         AS notifications_telegram,
       COALESCE(s.notifications_email, 1)            AS notifications_email,
       COALESCE(s.two_factor_enabled, 0)             AS two_factor_enabled
     FROM users u
     JOIN roles r ON r.id = u.role_id
     LEFT JOIN user_settings s ON s.user_id = u.id
     WHERE u.id = ?`,
    [req.params.id]
  );
  if (!rows[0]) return fail(res, 'User not found', 404);
  return ok(res, rows[0]);
});


// PUT /api/users/:id/settings
// body: any subset of { address, date_of_birth, gender, theme, language,
//                        notifications_telegram, notifications_email, two_factor_enabled }
// Upsert on the unique user_id key: works whether or not a row already
// exists, so callers never need a separate "check row exists" query first.
const updateSettings = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    address = null,
    date_of_birth = null,
    gender = 'unspecified',
    theme = 'system',
    language = 'en',
    notifications_telegram = 0,
    notifications_email = 1,
    two_factor_enabled = 0,
  } = req.body;
 
  await query(
    `INSERT INTO user_settings
       (user_id, address, date_of_birth, gender, theme, language,
        notifications_telegram, notifications_email, two_factor_enabled)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       address = VALUES(address),
       date_of_birth = VALUES(date_of_birth),
       gender = VALUES(gender),
       theme = VALUES(theme),
       language = VALUES(language),
       notifications_telegram = VALUES(notifications_telegram),
       notifications_email = VALUES(notifications_email),
       two_factor_enabled = VALUES(two_factor_enabled)`,
    [id, address, date_of_birth, gender, theme, language,
     notifications_telegram, notifications_email, two_factor_enabled]
  );
 
  return ok(res, null, 'Settings updated');
});

module.exports = { getAll, getById, getProfile, updateSettings, create, update, remove };
