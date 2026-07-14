const bcrypt = require('bcryptjs');
const { query, ok, fail, asyncHandler } = require('../utils/helper');
const { sendSecurityAlert } = require('../utils/mailer');

// GET /api/settings -> the logged-in user's own profile + preferences
const getMySettings = asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT u.id, u.full_name, u.email, u.phone, u.profile_image,
            s.address, s.date_of_birth, s.gender, s.theme, s.language,
            s.notifications_email, s.notifications_sms, s.two_factor_enabled
     FROM users u
     LEFT JOIN user_settings s ON s.user_id = u.id
     WHERE u.id = ?`,
    [req.user.id]
  );
  if (!rows[0]) return fail(res, 'Settings not found', 404);
  return ok(res, rows[0]);
});

// PUT /api/settings/profile
// const updateProfile = asyncHandler(async (req, res) => {
//   const { full_name, email, phone, address, date_of_birth, gender } = req.body;
//   await query('UPDATE users SET full_name=?, email=?, phone=? WHERE id=?', [full_name, email, phone, req.user.id]);
//   await query(
//     'UPDATE user_settings SET address=?, date_of_birth=?, gender=? WHERE user_id=?',
//     [address, date_of_birth, gender, req.user.id]
//   );
//   return ok(res, null, 'Profile updated');
// });

// const updateProfile = asyncHandler(async (req, res) => {
//   const { full_name, email, phone, address, date_of_birth, gender } = req.body;

//   // grab the current email BEFORE overwriting it
//   const rows = await query('SELECT email FROM users WHERE id = ?', [req.user.id]);
//   const oldEmail = rows[0]?.email;

//   await query('UPDATE users SET full_name=?, email=?, phone=? WHERE id=?', [full_name, email, phone, req.user.id]);
//   await query(
//     'UPDATE user_settings SET address=?, date_of_birth=?, gender=? WHERE user_id=?',
//     [address, date_of_birth, gender, req.user.id]
//   );

//   if (email && oldEmail && email !== oldEmail) {
//     await sendSecurityAlert({
//       to: oldEmail, // send to OLD email so a hijacker can't intercept it
//       subject: 'Your account email was changed',
//       message: `Your account email was changed to ${email} on ${new Date().toLocaleString()}.`,
//     });
//   }

//   return ok(res, null, 'Profile updated');
// });

const updateProfile = asyncHandler(async (req, res) => {
  const { full_name, email, phone, address, date_of_birth, gender } = req.body;

  await query('UPDATE users SET full_name=?, email=?, phone=? WHERE id=?', [full_name, email, phone, req.user.id]);

  await query(
    `INSERT INTO user_settings (user_id, address, date_of_birth, gender)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       address=VALUES(address),
       date_of_birth=VALUES(date_of_birth),
       gender=VALUES(gender)`,
    [req.user.id, address, date_of_birth, gender]
  );

  return ok(res, null, 'Profile updated');
});

// PUT /api/settings/preferences
const updatePreferences = asyncHandler(async (req, res) => {
  const { theme, language, notifications_email, notifications_sms } = req.body;
  await query(
    `UPDATE user_settings SET theme=?, language=?, notifications_email=?, notifications_sms=? WHERE user_id=?`,
    [theme, language, notifications_email ? 1 : 0, notifications_sms ? 1 : 0, req.user.id]
  );
  return ok(res, null, 'Preferences updated');
});

// PUT /api/settings/password
const updatePassword = asyncHandler(async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) return fail(res, 'Both current and new password are required', 400);

  const rows = await query('SELECT password FROM users WHERE id = ?', [req.user.id]);
  const match = await bcrypt.compare(current_password, rows[0].password);
  if (!match) return fail(res, 'Current password is incorrect', 401);

  const hashed = await bcrypt.hash(new_password, 10);
  await query('UPDATE users SET password=? WHERE id=?', [hashed, req.user.id]);
  return ok(res, null, 'Password updated');
});

// const updatePassword = asyncHandler(async (req, res) => {
//   const { current_password, new_password } = req.body;
//   if (!current_password || !new_password) return fail(res, 'Both current and new password are required', 400);

//   const rows = await query('SELECT email, password FROM users WHERE id = ?', [req.user.id]);
//   const match = await bcrypt.compare(current_password, rows[0].password);
//   if (!match) return fail(res, 'Current password is incorrect', 401);

//   const hashed = await bcrypt.hash(new_password, 10);
//   await query('UPDATE users SET password=? WHERE id=?', [hashed, req.user.id]);

//   await sendSecurityAlert({
//     to: rows[0].email,
//     subject: 'Your password was changed',
//     message: `Your password was changed on ${new Date().toLocaleString()}.`,
//   });

//   return ok(res, null, 'Password updated');
// });

// PUT /api/settings/two-factor
const updateTwoFactor = asyncHandler(async (req, res) => {
  const { enabled } = req.body;
  await query('UPDATE user_settings SET two_factor_enabled=? WHERE user_id=?', [enabled ? 1 : 0, req.user.id]);
  return ok(res, null, 'Two-factor setting updated');
});

module.exports = { getMySettings, updateProfile, updatePreferences, updatePassword, updateTwoFactor };
