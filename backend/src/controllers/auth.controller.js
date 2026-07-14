const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, ok, fail, asyncHandler } = require('../utils/helper');

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return fail(res, 'Email and password are required', 400);

  const rows = await query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  const user = rows[0];
  if (!user) return fail(res, 'Invalid email or password', 401);
  if (user.status !== 'active') return fail(res, 'This account is inactive', 403);

  const match = await bcrypt.compare(password, user.password);
  if (!match) return fail(res, 'Invalid email or password', 401);

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  const { password: _pw, ...safeUser } = user;
  return ok(res, { token, user: safeUser }, 'Login successful');
});

// GET /api/auth/me
const me = asyncHandler(async (req, res) => {
  const rows = await query(
    'SELECT id, full_name, username, email, phone, role, profile_image, status FROM users WHERE id = ?',
    [req.user.id]
  );
  if (!rows[0]) return fail(res, 'User not found', 404);
  return ok(res, rows[0]);
});

module.exports = { login, me };
