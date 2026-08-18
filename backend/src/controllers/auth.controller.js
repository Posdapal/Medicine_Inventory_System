const bcrypt = require('bcryptjs');
const { query, ok, fail, asyncHandler } = require('../utils/helper');
const generateToken = require('../utils/generateToken');

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

// user here is the JOINed row: { id, full_name, email, password, role (from roles.name),
// status, must_change_password, created_at, updated_at }
function publicUser(user) {
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    role: user.role.toLowerCase(), // "administrator" or "staff" -- matches ADMIN_ROLE in auth.middleware.js
    status: user.status,
    mustChangePassword: Boolean(user.must_change_password),
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

const USER_WITH_ROLE_SELECT = `
  SELECT u.id, u.full_name, u.email, u.password, r.name AS role, u.status,
         u.must_change_password, u.created_at, u.updated_at
  FROM users u
  JOIN roles r ON r.id = u.role_id
`;

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!email || !password) return fail(res, 'Email and password are required', 400);

  const rows = await query(`${USER_WITH_ROLE_SELECT} WHERE LOWER(u.email) = ? LIMIT 1`, [email]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return fail(res, 'Invalid email or password', 401);
  }
  if (user.status !== 'active') return fail(res, 'This account is inactive', 403);

  return ok(
    res,
    { token: generateToken(publicUser(user)), user: publicUser(user) },
    'Login successful'
  );
});

// POST /api/auth/change-password
const changePassword = asyncHandler(async (req, res) => {
  const currentPassword = String(req.body.currentPassword || req.body.current_password || '');
  const newPassword = String(req.body.newPassword || req.body.new_password || '');

  if (!currentPassword || !newPassword) {
    return fail(res, 'Current password and new password are required', 400);
  }
  if (!PASSWORD_PATTERN.test(newPassword)) {
    return fail(
      res,
      'Password must be at least 8 characters and include uppercase, lowercase, number, and special character',
      400
    );
  }

  const rows = await query(`${USER_WITH_ROLE_SELECT} WHERE u.id = ? LIMIT 1`, [req.user.id]);
  const user = rows[0];
  if (!user) return fail(res, 'User not found', 404);
  if (!(await bcrypt.compare(currentPassword, user.password))) {
    return fail(res, 'Current password is incorrect', 400);
  }
  if (await bcrypt.compare(newPassword, user.password)) {
    return fail(res, 'New password must be different from the current password', 400);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await query(
    'UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?',
    [hashedPassword, user.id]
  );

  const updatedUser = { ...user, must_change_password: 0 };
  return ok(
    res,
    { token: generateToken(publicUser(updatedUser)), user: publicUser(updatedUser) },
    'Password changed successfully'
  );
});

// GET /api/auth/profile
const profile = asyncHandler(async (req, res) => {
  const rows = await query(`${USER_WITH_ROLE_SELECT} WHERE u.id = ? LIMIT 1`, [req.user.id]);
  if (!rows[0]) return fail(res, 'User not found', 404);
  if (rows[0].status !== 'active') return fail(res, 'This account is inactive', 403);
  return ok(res, publicUser(rows[0]));
});

module.exports = { login, changePassword, profile };
