const db = require('../../mocks/db.mock');
const { replies, response } = require('../../mocks/controller');
const { query, queryPage, beginTransaction, commit, rollback, ok } = require('../../../utils/helper');
test('shouldPassQueryParametersAndReturnRows', async () => {
  replies([{ id: 1 }]); await expect(query('SELECT * FROM products WHERE id=?', [1])).resolves.toEqual([{ id: 1 }]);
  expect(db.query).toHaveBeenCalledWith('SELECT * FROM products WHERE id=?', [1], expect.any(Function));
});
test.each(['query', 'queryPage'])('shouldRejectDatabaseError %s', async (name) => {
  const error = new Error('database failed'); replies(error);
  await expect(name === 'query' ? query('SELECT 1') : queryPage({ query: {} }, 'SELECT 1')).rejects.toBe(error);
});
test.each(['', 'ORDER BY id'])('shouldReturnUnpaginatedRows %s', async (order) => {
  replies([{ id: 1 }]); await expect(queryPage({ query: {} }, 'SELECT * FROM products', [], order)).resolves.toEqual([{ id: 1 }]);
  expect(db.query.mock.calls[0][0]).toBe(`SELECT * FROM products${order ? ` ${order}` : ''}`);
});
test.each([
  [{ page: '2', limit: '10' }, [{ total: '25' }], { page: 2, limit: 10, total: 25, total_pages: 3 }, 10],
  [{ page: '999', limit: '10' }, [{ total: 25 }], { page: 3, limit: 10, total: 25, total_pages: 3 }, 20],
  [{ page: '-2', limit: '1000' }, [{ total: 0 }], { page: 1, limit: 100, total: 0, total_pages: 1 }, 0],
  [{ page: 'bad', limit: '-2' }, [], { page: 1, limit: 1, total: 0, total_pages: 1 }, 0],
  [{ limit: 'bad' }, [{}], { page: 1, limit: 10, total: 0, total_pages: 1 }, 0],
])('shouldClampPaginationAndPreserveFilters %j', async (params, count, pagination, offset) => {
  replies(count, [{ id: 1 }]);
  await expect(queryPage({ query: params }, 'SELECT * FROM products WHERE status=?', ['active'], 'ORDER BY id')).resolves.toEqual({ items: [{ id: 1 }], pagination });
  expect(db.query.mock.calls[0][1]).toEqual(['active']);
  expect(db.query.mock.calls[1][1]).toEqual(['active', pagination.limit, offset]);
  expect(db.query.mock.calls[1][0]).toContain('ORDER BY id LIMIT ? OFFSET ?');
});
test('shouldPaginateWithoutSortClause', async () => {
  replies([], []); await queryPage({ query: { page: 1 } }, 'SELECT 1');
  expect(db.query.mock.calls[1][0]).toBe('SELECT 1 LIMIT ? OFFSET ?');
});
test('shouldStopAfterCountFailure', async () => {
  replies(new Error('count failed')); await expect(queryPage({ query: { page: 1 } }, 'SELECT 1')).rejects.toThrow('count failed');
  expect(db.query).toHaveBeenCalledTimes(1);
});
test('shouldPropagatePageFetchFailure', async () => {
  replies([{ total: 1 }], new Error('page failed')); await expect(queryPage({ query: { page: 1 } }, 'SELECT 1')).rejects.toThrow('page failed');
});
test.each([['beginTransaction', beginTransaction], ['commit', commit]])('shouldResolveAndRejectTransactionHelper %s', async (name, fn) => {
  await expect(fn()).resolves.toBeUndefined();
  const error = new Error('transaction failed'); db[name].mockImplementationOnce(cb => cb(error));
  await expect(fn()).rejects.toBe(error);
});
test('shouldResolveRollbackEvenWhenDriverReturnsError', async () => {
  await expect(rollback()).resolves.toBeUndefined(); db.rollback.mockImplementationOnce(cb => cb(new Error('rollback failed')));
  await expect(rollback()).resolves.toBeUndefined();
});
test('shouldDefaultSuccessDataToNull', () => {
  const res = response(); ok(res); expect(res.body).toEqual({ success: true, message: 'Success', data: null });
});
