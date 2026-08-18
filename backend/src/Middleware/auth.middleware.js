const jwt = require('jsonwebtoken');
const { fail, query } = require('../utils/helper');

// Keep this list in sync with the ENUM in migration_user_permissions.sql
const VALID_MODULES = ['products', 'suppliers', 'categories', 'stock', 'reports'];

const ACTION_COLUMN = {
  create: 'can_create',
  read: 'can_read',
  update: 'can_update',
  delete: 'can_delete',
};

// Roles table stores 'Administrator' / 'Staff' (see seed data). The JWT is
// expected to carry role as a lowercased string (see auth.controller.js login),
// so compare against lowercase here too.
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
    req.user = decoded; // { id, email, role, full_name } -- role is lowercase, e.g. "administrator" or "staff"
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
// - Staff must have an explicit user_permissions row for the module with the
//   relevant can_* flag set to 1, granted by an admin via /api/permissions.
function checkPermission(module, action) {
  if (!VALID_MODULES.includes(module)) throw new Error(`checkPermission: unknown module "${module}"`);
  const column = ACTION_COLUMN[action];
  if (!column) throw new Error(`checkPermission: unknown action "${action}"`);

  return async function (req, res, next) {
    try {
      if (!req.user) return fail(res, 'Authentication token missing', 401);
      if (req.user.role === ADMIN_ROLE) return next();

      const rows = await query(
        `SELECT ${column} AS allowed FROM user_permissions WHERE user_id = ? AND module = ?`,
        [req.user.id, module]
      );
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
