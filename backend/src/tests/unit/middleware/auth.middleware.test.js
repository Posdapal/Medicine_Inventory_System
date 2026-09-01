const jwt = require('jsonwebtoken');
const { verifyToken, requireAdmin } = require('../../../src/middleware/auth.middleware');

// The middleware reads process.env.JWT_SECRET, so pin it for the test run.
beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret';
});

// Helper to build a fake Express response with jest.fn() spies for the
// chained .status().json() calls, so we can assert on what was sent back.
function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('auth.middleware verifyToken', () => {
  it('rejects a request with no Authorization header', () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Authentication token missing' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a header that is not in "Bearer <token>" form', () => {
    const req = { headers: { authorization: 'Token abc123' } };
    const res = mockRes();
    const next = jest.fn();

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects an invalid/garbled token', () => {
    const req = { headers: { authorization: 'Bearer not-a-real-token' } };
    const res = mockRes();
    const next = jest.fn();

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid or expired token' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects an expired token', () => {
    const expiredToken = jwt.sign({ id: 1 }, process.env.JWT_SECRET, { expiresIn: -10 });
    const req = { headers: { authorization: `Bearer ${expiredToken}` } };
    const res = mockRes();
    const next = jest.fn();

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() and attaches the decoded payload to req.user for a valid token', () => {
    const payload = { id: 7, email: 'admin@clinic.local', role: 'admin', full_name: 'Admin User' };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    verifyToken(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(req.user).toMatchObject(payload);
  });
});

describe('auth.middleware requireAdmin', () => {
  it('rejects when req.user is missing (verifyToken was skipped)', () => {
    const req = {};
    const res = mockRes();
    const next = jest.fn();

    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a non-admin role', () => {
    const req = { user: { role: 'stock staff' } };
    const res = mockRes();
    const next = jest.fn();

    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Admin access required' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() for role = "admin"', () => {
    const req = { user: { role: 'admin' } };
    const res = mockRes();
    const next = jest.fn();

    requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
