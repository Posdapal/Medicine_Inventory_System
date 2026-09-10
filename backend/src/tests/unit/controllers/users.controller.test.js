jest.mock('bcryptjs', () => ({ hash: jest.fn() }));
const bcrypt = require('bcryptjs');
const db = require('../../mocks/db.mock');
const { invoke, replies } = require('../../mocks/controller');
const c = require('../../../controllers/users.controller');
const body = { full_name: 'Test User', username: 'test', email: 'test@example.com', password: 'Secure123!', roleId: 3 };
beforeEach(() => bcrypt.hash.mockResolvedValue('hashed-password'));
test.each(Object.keys(body))('shouldRequireUserField %s', async (key) => {
  const input = { ...body }; delete input[key];
  expect((await invoke(c.create, { body: input })).res.statusCode).toBe(400); expect(db.query).not.toHaveBeenCalled();
});
test.each(['Administrator', 'Pharmacist', 'Stock Staff'])('shouldCreateUserWithResolvedRole %s', async (role) => {
  replies([{ id: 3, name: role }], { insertId: 11 });
  const { res } = await invoke(c.create, { body });
  expect(res.statusCode).toBe(201); expect(res.body.data).toEqual({ id: 11 });
  expect(bcrypt.hash).toHaveBeenCalledWith('Secure123!', 10);
  expect(db.query).toHaveBeenLastCalledWith(expect.stringContaining('INSERT INTO users'), [3, 'Test User', 'test', 'test@example.com', 'hashed-password'], expect.any(Function));
  expect(db.query.mock.calls[0][0]).toContain("status='active' AND LOWER(name)<>'staff'");
});
test.each(['create', 'update'])('shouldRejectUnknownOrInactiveRole %s', async (method) => {
  const { res } = await invoke(c[method], { body }); expect(res.statusCode).toBe(400);
  expect(res.body.message).toBe('Unknown or inactive role'); expect(bcrypt.hash).not.toHaveBeenCalled();
});
test.each(['getById', 'getProfile'])('shouldReturnUserNotFound %s', async (method) => {
  expect((await invoke(c[method])).res.statusCode).toBe(404);
});
test.each(['getById', 'getProfile'])('shouldReturnUser %s', async (method) => {
  const user = { id: 7, full_name: 'Test User', role: 'Stock Staff' }; replies([user]);
  expect((await invoke(c[method])).res.body.data).toEqual(user);
  expect(db.query.mock.calls[0][1]).toEqual(['7']);
});
test.each([{}, { search: 'Test', status: 'active' }])('shouldFilterUsers %j', async (query) => {
  replies([{ id: 7 }]); expect((await invoke(c.getAll, { query })).res.body.data).toEqual([{ id: 7 }]);
  expect(db.query.mock.calls[0][1]).toEqual(query.search ? ['%Test%', 'active'] : ['%']);
});
test.each([true, false])('shouldUpdateUserAndPreserveOrReplaceRole %s', async (replace) => {
  replies(replace ? [{ id: 3 }] : [{ role_id: 3 }], {});
  const { res } = await invoke(c.update, { body: { ...body, roleId: replace ? 3 : undefined, status: 'inactive' } });
  expect(res.statusCode).toBe(200);
  expect(db.query).toHaveBeenLastCalledWith(expect.stringContaining('UPDATE users'), ['Test User', 'test', 'test@example.com', 3, 'inactive', '7'], expect.any(Function));
});
test('shouldReturnUserNotFoundWhenPreservingRole', async () => { expect((await invoke(c.update)).res.statusCode).toBe(404); });
test('shouldDeleteUser', async () => {
  replies({ affectedRows: 1 }); expect((await invoke(c.remove)).res.body.message).toBe('User deleted');
  expect(db.query).toHaveBeenCalledWith('DELETE FROM users WHERE id = ?', ['7'], expect.any(Function));
});
test.each([{}, { address: 'Clinic', date_of_birth: '2000-01-01', gender: 'female', theme: 'dark', language: 'km', notifications_telegram: 1, notifications_email: 0, two_factor_enabled: 1 }])('shouldUpsertUserSettings %j', async (settings) => {
  replies({}); expect((await invoke(c.updateSettings, { body: settings })).res.statusCode).toBe(200);
  expect(db.query.mock.calls[0][0]).toContain('ON DUPLICATE KEY UPDATE');
  expect(db.query.mock.calls[0][1]).toEqual(Object.keys(settings).length ? ['7', 'Clinic', '2000-01-01', 'female', 'dark', 'km', 1, 0, 1] : ['7', null, null, 'unspecified', 'system', 'en', 0, 1, 0]);
});
test.each(Object.keys(c))('shouldForwardUserDatabaseError %s', async (method) => {
  const error = new Error('database failed'); replies(error);
  expect((await invoke(c[method], { body })).next).toHaveBeenCalledWith(error);
});
test('shouldForwardPasswordHashFailureWithoutCreatingUser', async () => {
  const error = new Error('hash failed'); replies([{ id: 3 }]); bcrypt.hash.mockRejectedValue(error);
  expect((await invoke(c.create, { body })).next).toHaveBeenCalledWith(error); expect(db.query).toHaveBeenCalledTimes(1);
});
test('shouldForwardUserInsertFailure', async () => {
  const error = new Error('duplicate username'); replies([{ id: 3 }], error);
  expect((await invoke(c.create, { body })).next).toHaveBeenCalledWith(error);
});
