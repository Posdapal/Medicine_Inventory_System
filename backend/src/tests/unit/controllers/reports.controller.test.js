const db = require('../../mocks/db.mock');
const { invoke, replies } = require('../../mocks/controller');
const c = require('../../../controllers/reports.controller');
const types = ['products', 'inventory', 'categories', 'units', 'suppliers', 'stock_in', 'stock_out', 'stock_movement', 'current_stock', 'low_stock', 'near_expiry', 'expired_products', 'users'];

describe.each(types)('Report %s', (report_type) => {
  test.each([{}, { date_range_start: '2026-09-01', date_range_end: '2026-09-10' }])('shouldGenerateReport %j', async (range) => {
    const rows = [{ product: 'Medicine', quantity: 10 }]; replies(rows);
    const { res, next } = await invoke(c.generate, { query: { report_type, ...range } });
    expect(next).not.toHaveBeenCalled(); expect(res.body.data).toEqual({ report_type, date_range_start: range.date_range_start || null, date_range_end: range.date_range_end || null, data: rows });
    expect(db.query.mock.calls[0][1]).toEqual(Object.values(range));
    const sql = db.query.mock.calls[0][0];
    if (range.date_range_end) expect(sql).toMatch(/<= \?|< DATE_ADD\(\?, INTERVAL 1 DAY\)/);
    if (report_type === 'low_stock') expect(sql).toContain('HAVING available_quantity > 0 AND available_quantity <= p.minimum_stock');
    if (report_type === 'near_expiry') expect(sql).toContain('BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)');
    if (report_type === 'expired_products') expect(sql).toContain('pb.expiry_date < CURDATE()');
  });
  test('shouldForwardReportDatabaseFailure', async () => {
    const error = new Error('report query failed'); replies(error);
    expect((await invoke(c.generate, { query: { report_type } })).next).toHaveBeenCalledWith(error);
  });
});
test.each([{}, { report_type: 'invalid' }, { report_type: 'products', date_range_start: '09/10/2026' }, { report_type: 'products', date_range_end: 'bad' }, { report_type: 'products', date_range_start: '2026-09-11', date_range_end: '2026-09-10' }])('shouldRejectInvalidReportRequest %j', async (query) => {
  expect((await invoke(c.generate, { query })).res.statusCode).toBe(400); expect(db.query).not.toHaveBeenCalled();
});
test('shouldAllowSameDayReport', async () => {
  const { res } = await invoke(c.generate, { query: { report_type: 'products', date_range_start: '2026-09-10', date_range_end: '2026-09-10' } });
  expect(res.statusCode).toBe(200); expect(db.query.mock.calls[0][0]).toContain('p.created_at < DATE_ADD(?, INTERVAL 1 DAY)');
});
test('shouldReturnEmptyForUnknownInternalReportType', async () => {
  await expect(c.buildReportData('unknown')).resolves.toEqual([]); expect(db.query).not.toHaveBeenCalled();
});
test.each([{}, { title: 'Report' }, { report_type: 'products' }])('shouldRequireSnapshotTitleAndType %j', async (body) => {
  expect((await invoke(c.save, { body })).res.statusCode).toBe(400); expect(db.query).not.toHaveBeenCalled();
});
test.each([true, false])('shouldSaveSnapshot %s', async (explicit) => {
  replies({ insertId: 5 });
  const body = { title: 'Report', report_type: 'products', ...(explicit ? { date_range_start: '2026-09-01', date_range_end: '2026-09-10', data_snapshot: [{ id: 1 }] } : {}) };
  const { res } = await invoke(c.save, { body, user: explicit ? { id: 2 } : undefined });
  expect(res.statusCode).toBe(201); expect(res.body.data.id).toBe(5);
  expect(db.query.mock.calls[0][1]).toEqual(['Report', 'products', body.date_range_start || null, body.date_range_end || null, explicit ? 2 : null, JSON.stringify(body.data_snapshot || [])]);
});
test('shouldListSavedReports', async () => {
  replies([{ id: 1 }]); expect((await invoke(c.getAll)).res.body.data).toEqual([{ id: 1 }]);
});
test('shouldReturnSavedReport', async () => {
  replies([{ id: 7 }]); expect((await invoke(c.getById)).res.body.data).toEqual({ id: 7 });
});
test('shouldReturnReportNotFound', async () => { expect((await invoke(c.getById)).res.statusCode).toBe(404); });
test.each(['getAll', 'getById', 'save'])('shouldForwardSavedReportError %s', async (name) => {
  const error = new Error('database failed'); replies(error);
  expect((await invoke(c[name], { body: { title: 'Report', report_type: 'products' } })).next).toHaveBeenCalledWith(error);
});
