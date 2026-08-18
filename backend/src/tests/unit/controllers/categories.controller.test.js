jest.mock('../../../src/config/db', () => require('../../mocks/db.mock'));

const request = require('supertest');
const db = require('../../../src/config/db');
const createApp = require('../../../src/app');

const app = createApp();

describe('GET /api/categories', () => {
  it('returns the rows the database query resolves with', async () => {
    db.__setQueryResult([
      { id: 1, name: 'PPE & Safety', description: 'Protective equipment', status: 'active' },
      { id: 2, name: 'Diagnostics', description: 'Testing & measurement', status: 'active' },
    ]);

    const res = await request(app).get('/api/categories');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].name).toBe('PPE & Safety');
  });

  it('passes ?search= through as a LIKE pattern', async () => {
    let capturedParams;
    db.__setQueryImpl((sql, params, callback) => {
      capturedParams = params;
      callback(null, []);
    });

    await request(app).get('/api/categories?search=ppe');

    expect(capturedParams).toEqual(['%ppe%']);
  });

  it('returns 500 with the driver error message if the query fails', async () => {
    db.__setQueryError(new Error('ER_NO_SUCH_TABLE: categories'));

    const res = await request(app).get('/api/categories');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/ER_NO_SUCH_TABLE/);
  });
});

describe('POST /api/categories', () => {
  it('rejects a missing name with 400 and never touches the database', async () => {
    const res = await request(app).post('/api/categories').send({ description: 'no name given' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/name is required/i);
    expect(db.query).not.toHaveBeenCalled();
  });

  it('creates a category and returns the new id', async () => {
    db.__setQueryResult({ insertId: 42, affectedRows: 1 });

    const res = await request(app)
      .post('/api/categories')
      .send({ name: 'Consumables', description: 'Single-use supplies' });

    expect(res.status).toBe(201);
    expect(res.body.data).toEqual({ id: 42 });
  });

  it('defaults status to "active" when not provided', async () => {
    let capturedParams;
    db.__setQueryImpl((sql, params, callback) => {
      capturedParams = params;
      callback(null, { insertId: 1 });
    });

    await request(app).post('/api/categories').send({ name: 'Consumables' });

    // (name, description, status) -> description defaults to null, status to 'active'
    expect(capturedParams).toEqual(['Consumables', null, 'active']);
  });
});

describe('PUT /api/categories/:id', () => {
  it('rejects a missing name with 400', async () => {
    const res = await request(app).put('/api/categories/1').send({});
    expect(res.status).toBe(400);
  });

  it('updates the category', async () => {
    db.__setQueryResult({ affectedRows: 1 });

    const res = await request(app)
      .put('/api/categories/1')
      .send({ name: 'Renamed', description: 'Updated', status: 'inactive' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/updated/i);
  });
});

describe('DELETE /api/categories/:id', () => {
  it('deletes the category', async () => {
    db.__setQueryResult({ affectedRows: 1 });

    const res = await request(app).delete('/api/categories/1');

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });
});
