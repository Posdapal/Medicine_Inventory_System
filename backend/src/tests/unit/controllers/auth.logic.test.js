jest.mock('bcryptjs', () => ({ compare: jest.fn(), hash: jest.fn() }));
jest.mock('../../../utils/generateToken', () => jest.fn(() => 'signed-token'));
const bcrypt = require('bcryptjs');
const generateToken = require('../../../utils/generateToken');
const db = require('../../mocks/db.mock');
const { invoke, replies } = require('../../mocks/controller');
const c = require('../../../controllers/auth.controller');
const user = { id: 2, full_name: 'Test User', username: 'test', email: 'test@example.com', password: 'hash', role: 'Pharmacist', role_id: 3, status: 'active', must_change_password: 1 };
const change = { currentPassword: 'Old123!x', newPassword: 'New123!x' };
beforeEach(() => { bcrypt.compare.mockReset(); bcrypt.hash.mockReset().mockResolvedValue('new-hash'); });
test.each(['Administrator', 'Pharmacist', 'Stock Staff', 'staff'])('shouldLoginAndNormalizeRole %s', async (role) => {
  replies([{ ...user, role }]); bcrypt.compare.mockResolvedValue(true);
  const { res } = await invoke(c.login, { body: { username: '  TEST ', password: 'password' } });
  expect(res.body.data.user.role).toBe(role === 'staff' ? 'stock staff' : role.toLowerCase());
  expect(res.body.data.user).not.toHaveProperty('password'); expect(res.body.data.user.mustChangePassword).toBe(true);
  expect(generateToken).toHaveBeenCalledWith(res.body.data.user);
  expect(db.query.mock.calls[0][1]).toEqual(['test', 'test']);
});
test.each([{}, { currentPassword: 'old' }, { newPassword: 'New123!x' }])('shouldRequireBothPasswords %j', async (body) => {
  expect((await invoke(c.changePassword, { body })).res.statusCode).toBe(400); expect(db.query).not.toHaveBeenCalled();
});
test.each(['short', 'lowercase1!', 'UPPERCASE1!', 'NoDigits!!', 'NoSymbols12'])('shouldRejectWeakNewPassword %s', async (newPassword) => {
  expect((await invoke(c.changePassword, { body: { ...change, newPassword } })).res.statusCode).toBe(400);
  expect(db.query).not.toHaveBeenCalled();
});
test('shouldReturnUserNotFoundWhenChangingPassword', async () => {
  expect((await invoke(c.changePassword, { body: change })).res.statusCode).toBe(404);
});
test('shouldRejectIncorrectCurrentPassword', async () => {
  replies([user]); bcrypt.compare.mockResolvedValue(false);
  expect((await invoke(c.changePassword, { body: change })).res.body.message).toBe('Current password is incorrect');
  expect(bcrypt.hash).not.toHaveBeenCalled();
});
test('shouldRejectPasswordReuse', async () => {
  replies([user]); bcrypt.compare.mockResolvedValue(true);
  expect((await invoke(c.changePassword, { body: change })).res.body.message).toContain('different');
  expect(bcrypt.hash).not.toHaveBeenCalled();
});
test.each([change, { current_password: change.currentPassword, new_password: change.newPassword }])('shouldChangePasswordAndClearForcedChangeFlag %j', async (body) => {
  replies([user], {}); bcrypt.compare.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
  const { res } = await invoke(c.changePassword, { body });
  expect(res.statusCode).toBe(200); expect(res.body.data.user.mustChangePassword).toBe(false);
  expect(bcrypt.hash).toHaveBeenCalledWith(change.newPassword, 12);
  expect(db.query).toHaveBeenLastCalledWith(expect.stringContaining('must_change_password = 0'), ['new-hash', 2], expect.any(Function));
});
test('shouldRejectInactiveProfile', async () => {
  replies([{ ...user, status: 'inactive' }]); expect((await invoke(c.profile)).res.statusCode).toBe(403);
});
test.each(['login', 'profile', 'changePassword'])('shouldForwardAuthDatabaseError %s', async (method) => {
  const error = new Error('database failed'); replies(error);
  expect((await invoke(c[method], { body: { ...change, email: 'test@example.com', password: 'password' } })).next).toHaveBeenCalledWith(error);
});
test('shouldForwardHashFailure', async () => {
  const error = new Error('hash failed'); replies([user]); bcrypt.compare.mockResolvedValueOnce(true).mockResolvedValueOnce(false); bcrypt.hash.mockRejectedValue(error);
  expect((await invoke(c.changePassword, { body: change })).next).toHaveBeenCalledWith(error);
});
test('shouldNotIssueTokenWhenPasswordUpdateFails', async () => {
  const error = new Error('write failed'); replies([user], error); bcrypt.compare.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
  expect((await invoke(c.changePassword, { body: change })).next).toHaveBeenCalledWith(error); expect(generateToken).not.toHaveBeenCalled();
});
