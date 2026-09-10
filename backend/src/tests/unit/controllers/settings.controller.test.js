jest.mock('bcryptjs', () => ({ compare: jest.fn(), hash: jest.fn() }));
const bcrypt = require('bcryptjs');
const db = require('../../mocks/db.mock');
const { invoke, replies } = require('../../mocks/controller');
const c = require('../../../controllers/settings.controller');
beforeEach(() => { bcrypt.compare.mockReset(); bcrypt.hash.mockReset().mockResolvedValue('new-hash'); });
test('shouldReturnOwnSettings', async () => {
  replies([{ id: 2, theme: 'dark' }]); expect((await invoke(c.getMySettings)).res.body.data).toEqual({ id: 2, theme: 'dark' });
  expect(db.query.mock.calls[0][1]).toEqual([2]);
});
test('shouldReturnSettingsNotFound', async () => { expect((await invoke(c.getMySettings)).res.statusCode).toBe(404); });
test('shouldUpdateOwnProfileAndUpsertPreferences', async () => {
  replies({}, {});
  const { res } = await invoke(c.updateProfile, { body: { full_name: 'Test', email: 'test@example.com', phone: '123', address: 'Clinic', date_of_birth: '2000-01-01', gender: 'female' } });
  expect(res.statusCode).toBe(200);
  expect(db.query.mock.calls[0][1]).toEqual(['Test', 'test@example.com', '123', 2]);
  expect(db.query.mock.calls[1][1]).toEqual([2, 'Clinic', '2000-01-01', 'female']);
  expect(db.query.mock.calls[1][0]).toContain('ON DUPLICATE KEY UPDATE');
});
test.each([true, false])('shouldStoreBooleanPreferences %s', async (enabled) => {
  replies({});
  expect((await invoke(c.updatePreferences, { body: { theme: 'dark', language: 'en', notifications_email: enabled, notifications_telegram: enabled } })).res.statusCode).toBe(200);
  expect(db.query.mock.calls[0][1]).toEqual(['dark', 'en', Number(enabled), Number(enabled), 2]);
});
test.each([true, false])('shouldStoreTwoFactorSetting %s', async (enabled) => {
  replies({}); expect((await invoke(c.updateTwoFactor, { body: { enabled } })).res.statusCode).toBe(200);
  expect(db.query.mock.calls[0][1]).toEqual([Number(enabled), 2]);
});
test.each([{}, { current_password: 'old' }, { new_password: 'new' }])('shouldRequireBothPasswords %j', async (body) => {
  expect((await invoke(c.updatePassword, { body })).res.statusCode).toBe(400); expect(db.query).not.toHaveBeenCalled();
});
test('shouldRejectIncorrectPassword', async () => {
  replies([{ password: 'hash' }]); bcrypt.compare.mockResolvedValue(false);
  expect((await invoke(c.updatePassword, { body: { current_password: 'old', new_password: 'new' } })).res.statusCode).toBe(400);
  expect(bcrypt.hash).not.toHaveBeenCalled();
});
test('shouldUpdatePasswordWithHash', async () => {
  replies([{ password: 'hash' }], {}); bcrypt.compare.mockResolvedValue(true);
  const { res } = await invoke(c.updatePassword, { body: { current_password: 'old', new_password: 'new' } });
  expect(res.body.message).toBe('Password updated'); expect(bcrypt.hash).toHaveBeenCalledWith('new', 10);
  expect(db.query).toHaveBeenLastCalledWith('UPDATE users SET password=? WHERE id=?', ['new-hash', 2], expect.any(Function));
});
test.each(['getMySettings', 'updateProfile', 'updatePreferences', 'updatePassword', 'updateTwoFactor'])('shouldForwardSettingsDatabaseFailure %s', async (method) => {
  const error = new Error('database failed'); replies(error);
  expect((await invoke(c[method], { body: { current_password: 'old', new_password: 'new' } })).next).toHaveBeenCalledWith(error);
});
test('shouldForwardProfileUpsertFailure', async () => {
  const error = new Error('upsert failed'); replies({}, error);
  expect((await invoke(c.updateProfile)).next).toHaveBeenCalledWith(error);
});
