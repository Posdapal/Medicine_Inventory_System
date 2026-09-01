const jwt = require('jsonwebtoken');
const { fail, query } = require('../utils/helper');

// Keep this list in sync with the ENUM in migration_user_permissions.sql
const { MODULES: VALID_MODULES, ACTION_COLUMNS: ACTION_COLUMN } = require('../config/permissions');

// The JWT carries the database role name as a lowercased string.
const ADMIN_ROLE = 'administrator';

// Verifies the Bearer token and attaches the decoded payload to req.user
function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return fail(res, 'Authentication token missing', 401);
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role, full_name }
    next();
  } catch (err) {
    return fail(res, 'Invalid or expired token', 401);
  }
}

// Use after verifyToken to restrict a route to the Administrator role
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== ADMIN_ROLE) {
    return fail(res, 'Admin access required', 403);
  }
  next();
}

// NOTE: `must_change_password` does not exist in the current schema.
// This middleware is a no-op until that column (and its inclusion in the
// JWT payload at login) is added. Left in place so routes that reference
// it don't break, but it will never trigger the 403 today.
function requirePasswordChanged(req, res, next) {
  if (req.user?.mustChangePassword) {
    return fail(res, 'You must change your password before accessing this resource', 403, {
      code: 'PASSWORD_CHANGE_REQUIRED',
    });
  }
  next();
}

// Use after verifyToken to gate a route on a specific module + CRUD action.
// - Administrators always pass (full CRUD everywhere).
// - Operational roles must have an explicit role permission for the module with the
//   relevant can_* flag set to 1, granted by an admin via /api/permissions.
function checkPermission(module, action) {
  if (!VALID_MODULES.includes(module)) throw new Error(`checkPermission: unknown module "${module}"`);
  const column = ACTION_COLUMN[action];
  if (!column) throw new Error(`checkPermission: unknown action "${action}"`);

  return async function (req, res, next) {
    try {
      if (!req.user) return fail(res, 'Authentication token missing', 401);
      const rows = await query(
        `SELECT r.name AS role_name, rp.${column} AS allowed FROM users u
         JOIN roles r ON r.id=u.role_id
         LEFT JOIN role_permissions rp ON rp.role_id=r.id AND rp.module=?
         WHERE u.id=? AND u.status='active'`,
        [module, req.user.id]
      );
      if (rows[0]?.role_name?.toLowerCase() === ADMIN_ROLE) return next();
      if (!rows[0] || !rows[0].allowed) {
        return fail(res, `You do not have ${action} access to ${module}`, 403);
      }
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = { verifyToken, requireAdmin, requirePasswordChanged, checkPermission, VALID_MODULES };
