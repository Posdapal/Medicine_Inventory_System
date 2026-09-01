const { query, ok, fail, asyncHandler } = require('../utils/helper');
const { MODULES, PERMISSION_COLUMNS } = require('../config/permissions');
const empty = (value=false) => Object.fromEntries(PERMISSION_COLUMNS.map(key => [key, value]));
function buildFullMap(rows, admin=false) {
  const map = Object.fromEntries(MODULES.map(module => [module, empty(admin)]));
  rows.forEach(row => { map[row.module] = Object.fromEntries(PERMISSION_COLUMNS.map(key => [key, !!row[key]])); });
  return map;
}
const getMine = asyncHandler(async (req,res) => {
  const roles = await query('SELECT r.id,r.name FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=?',[req.user.id]);
  if (!roles[0]) return fail(res,'Role not found',404);
  const admin = roles[0].name.toLowerCase() === 'administrator';
  const rows = admin ? [] : await query(`SELECT module,${PERMISSION_COLUMNS.join(',')} FROM role_permissions WHERE role_id=?`,[roles[0].id]);
  return ok(res,{ roleId: roles[0].id, permissions: buildFullMap(rows,admin) });
});
module.exports = { getMine, buildFullMap, PERMISSION_COLUMNS };
