const jwt = require('jsonwebtoken');
const { fail } = require('../utils/helper');

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

// Use after verifyToken to restrict a route to role = 'admin'
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return fail(res, 'Admin access required', 403);
  }
  next();
}

module.exports = { verifyToken, requireAdmin };
