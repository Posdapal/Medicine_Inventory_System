const { invoke } = require('../../mocks/controller');
const db = require('../../mocks/db.mock');
const { checkPermission, requirePasswordChanged, requireAdmin } = require('../../../middleware/auth.middleware');
test.each([undefined, { mustChangePassword: false }, { mustChangePassword: true }])('shouldEnforcePasswordChangeFlag %j', async (user) => {
  const { res, next } = await invoke(requirePasswordChanged, { user });
  if (user?.mustChangePassword) {
    expect(res.statusCode).toBe(403); expect(res.body.errors.code).toBe('PASSWORD_CHANGE_REQUIRED'); expect(next).not.toHaveBeenCalled();
  } else expect(next).toHaveBeenCalledWith();
});
test('shouldRejectPharmacistFromAdminOnlyAction', async () => {
  expect((await invoke(requireAdmin, { user: { role: 'pharmacist' } })).res.statusCode).toBe(403);
});
test('shouldRejectUnknownPermissionModule', () => { expect(() => checkPermission('unknown', 'read')).toThrow('unknown module'); });
test('shouldRejectUnknownPermissionAction', () => { expect(() => checkPermission('stock_in', 'unknown')).toThrow('unknown action'); });
test('shouldRequireAuthenticatedUser', async () => {
  expect((await invoke(checkPermission('stock_in', 'create'), { user: undefined })).res.statusCode).toBe(401); expect(db.query).not.toHaveBeenCalled();
});
test.each([
  ['Administrator', 0, true], ['Pharmacist', 1, true], ['Stock Staff', 1, true], ['Pharmacist', 0, false], ['Stock Staff', null, false],
])('shouldEnforceOperationalAccess %s %s', async (role_name, allowed, accepted) => {
  db.__setQueryResult([{ role_name, allowed }]);
  const { res, next } = await invoke(checkPermission('stock_out', 'create'));
  if (accepted) expect(next).toHaveBeenCalledWith();
  else { expect(res.statusCode).toBe(403); expect(next).not.toHaveBeenCalled(); }
  expect(db.query.mock.calls[0][1]).toEqual(['stock_out', 2]);
  expect(db.query.mock.calls[0][0]).toContain('rp.can_create AS allowed');
});
test('shouldDenyMissingOrInactiveUser', async () => {
  expect((await invoke(checkPermission('stock_in', 'read'))).res.statusCode).toBe(403);
});
test('shouldForwardAccessDatabaseError', async () => {
  const error = new Error('database failed'); db.__setQueryError(error);
  expect((await invoke(checkPermission('stock_in', 'read'))).next).toHaveBeenCalledWith(error);
});
