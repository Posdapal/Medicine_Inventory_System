const { query, ok, fail, asyncHandler } = require('../utils/helper');
const { VALID_MODULES } = require('../middleware/auth.middleware');

// Build a full module -> flags map, defaulting anything not in the DB to all-false
function buildFullMap(rows) {
  const map = {};
  VALID_MODULES.forEach((m) => {
    map[m] = { can_create: false, can_read: false, can_update: false, can_delete: false };
  });
  rows.forEach((r) => {
    map[r.module] = {
      can_create: !!r.can_create,
      can_read: !!r.can_read,
      can_update: !!r.can_update,
      can_delete: !!r.can_delete,
    };
  });
  return map;
}

// GET /api/permissions/:userId  (admin only)
const getForUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const userRows = await query(
    `SELECT u.id, u.full_name, r.name AS role
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = ?`,
    [userId]
  );
  if (!userRows[0]) return fail(res, 'User not found', 404);

  const isAdmin = userRows[0].role.toLowerCase() === 'administrator';

  if (isAdmin) {
    const allTrue = {};
    VALID_MODULES.forEach((m) => {
      allTrue[m] = { can_create: true, can_read: true, can_update: true, can_delete: true };
    });
    return ok(res, { user_id: Number(userId), role: userRows[0].role, permissions: allTrue });
  }

  const rows = await query(
    'SELECT module, can_create, can_read, can_update, can_delete FROM user_permissions WHERE user_id = ?',
    [userId]
  );
  return ok(res, { user_id: Number(userId), role: userRows[0].role, permissions: buildFullMap(rows) });
});

// PUT /api/permissions/:userId  (admin only)
// body: { permissions: { products: { can_create, can_read, can_update, can_delete }, ... } }
const updateForUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { permissions } = req.body;

  const userRows = await query(
    `SELECT u.id, r.name AS role
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = ?`,
    [userId]
  );
  if (!userRows[0]) return fail(res, 'User not found', 404);
  if (userRows[0].role.toLowerCase() === 'administrator') {
    return fail(res, 'Admins already have full access; permissions cannot be edited for admin accounts', 400);
  }
  if (!permissions || typeof permissions !== 'object') {
    return fail(res, 'permissions object is required', 400);
  }

  for (const module of Object.keys(permissions)) {
    if (!VALID_MODULES.includes(module)) continue; // ignore unknown keys
    const p = permissions[module] || {};
    await query(
      `INSERT INTO user_permissions (user_id, module, can_create, can_read, can_update, can_delete)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         can_create = VALUES(can_create),
         can_read   = VALUES(can_read),
         can_update = VALUES(can_update),
         can_delete = VALUES(can_delete)`,
      [userId, module, p.can_create ? 1 : 0, p.can_read ? 1 : 0, p.can_update ? 1 : 0, p.can_delete ? 1 : 0]
    );
  }

  const rows = await query(
    'SELECT module, can_create, can_read, can_update, can_delete FROM user_permissions WHERE user_id = ?',
    [userId]
  );
  return ok(res, { user_id: Number(userId), role: userRows[0].role, permissions: buildFullMap(rows) }, 'Permissions updated');
});

module.exports = { getForUser, updateForUser, buildFullMap };
