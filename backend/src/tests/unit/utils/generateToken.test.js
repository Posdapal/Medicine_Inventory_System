const jwt = require('jsonwebtoken');
const generateToken = require('../../../utils/generateToken');
const originalEnv = { ...process.env };
beforeEach(() => { process.env.JWT_SECRET = 'unit-test-only-secret'; delete process.env.JWT_EXPIRES_IN; });
afterEach(() => { process.env = { ...originalEnv }; });
test.each([0, 1])('shouldSignExpectedClaimsAndDefaultLifetime %s', (flag) => {
  const token = generateToken({ id: 2, email: 'test@example.com', role: 'pharmacist', must_change_password: flag, password: 'secret' });
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  expect(decoded).toMatchObject({ id: 2, email: 'test@example.com', role: 'pharmacist', mustChangePassword: Boolean(flag) });
  expect(decoded.exp - decoded.iat).toBe(8 * 3600); expect(decoded).not.toHaveProperty('password');
});
test('shouldUseCustomTokenLifetime', () => {
  process.env.JWT_EXPIRES_IN = '1h'; const decoded = jwt.verify(generateToken({ id: 1 }), process.env.JWT_SECRET);
  expect(decoded.exp - decoded.iat).toBe(3600);
});
test('shouldRejectMissingSecret', () => {
  delete process.env.JWT_SECRET; expect(() => generateToken({ id: 1 })).toThrow('JWT_SECRET is not configured');
});
test('shouldRejectInvalidLifetime', () => {
  process.env.JWT_EXPIRES_IN = 'invalid'; expect(() => generateToken({ id: 1 })).toThrow();
});
