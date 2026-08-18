jest.mock('../../../src/config/db', () => require('../../mocks/db.mock'));

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const db = require('../../../src/config/db');
const createApp = require('../../../src/app');

const app = createApp();

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret';
});

describe('POST /api/auth/login', () => {
  it('rejects a request missing email or password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@clinic.local' });
    expect(res.status).toBe(400);
    expect(db.query).not.toHaveBeenCalled();
  });

  it('rejects an unknown email with 401 (and does not leak "user not found")', async () => {
    db.__setQueryResult([]); // no matching user

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@clinic.local', password: 'whatever' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('rejects an inactive account with 403', async () => {
    const hash = await bcrypt.hash('admin123', 10);
    db.__setQueryResult([
      { id: 1, email: 'admin@clinic.local', password: hash, status: 'inactive', role_name: 'admin' },
    ]);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@clinic.local', password: 'admin123' });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/inactive/i);
  });

  it('rejects the correct email with the wrong password', async () => {
    const hash = await bcrypt.hash('admin123', 10);
    db.__setQueryResult([
      { id: 1, email: 'admin@clinic.local', password: hash, status: 'active', role_name: 'admin' },
    ]);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@clinic.local', password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('logs in with the correct credentials, returns a valid JWT, and never leaks the password hash', async () => {
    const hash = await bcrypt.hash('admin123', 10);
    db.__setQueryResult([
      {
        id: 1,
        full_name: 'Admin User',
        email: 'admin@clinic.local',
        password: hash,
        status: 'active',
        role_name: 'admin',
      },
    ]);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@clinic.local', password: 'admin123' });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user).not.toHaveProperty('password');
    expect(res.body.data.user.email).toBe('admin@clinic.local');

    const decoded = jwt.verify(res.body.data.token, process.env.JWT_SECRET);
    expect(decoded).toMatchObject({ id: 1, email: 'admin@clinic.local', role: 'admin' });
  });

  it('the seeded bcrypt hash in clinic_erp.sql actually matches "admin123"', async () => {
    // Pulled straight from clinic_erp.sql's INSERT INTO `users` seed row —
    // if this ever fails after regenerating the seed data, login will be
    // broken for everyone using the default seeded admin account.
    const seededHash = '$2a$10$9H09tp.VXdJXKVLxOjn/8u5gW0CNe4rKUvyZRAH3K94W4ec7eilOK';
    await expect(bcrypt.compare('admin123', seededHash)).resolves.toBe(true);
  });
});

describe('GET /api/auth/me', () => {
  it('requires a valid Bearer token (401 without one)', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the current user for a valid token', async () => {
    db.__setQueryResult([
      { id: 1, full_name: 'Admin User', username: 'admin', email: 'admin@clinic.local', status: 'active', role_name: 'admin' },
    ]);

    const token = jwt.sign({ id: 1, email: 'admin@clinic.local', role: 'admin' }, process.env.JWT_SECRET);

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('admin@clinic.local');
  });

  it('returns 404 if the token is valid but the user no longer exists', async () => {
    db.__setQueryResult([]);

    const token = jwt.sign({ id: 999, email: 'ghost@clinic.local', role: 'admin' }, process.env.JWT_SECRET);

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
