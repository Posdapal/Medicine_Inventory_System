const db = require('../../mocks/db.mock');
const { invoke, replies } = require('../../mocks/controller');
const c = require('../../../controllers/dashboard.controller');
beforeEach(() => { jest.useFakeTimers(); jest.setSystemTime(new Date(2026, 0, 15, 12)); });
afterEach(() => jest.useRealTimers());
test('shouldFillSixMonthsAcrossYearBoundaryWithNumericTotals', async () => {
  replies([{ ym: '2025-12', stock_in: '12', stock_out: '4' }, { ym: '2026-01', stock_in: '0', stock_out: null }]);
  const { res } = await invoke(c.getStockInOutChart);
  expect(res.body.data).toHaveLength(6);
  expect(res.body.data[0]).toEqual({ ym: '2025-08', month: 'Aug 2025', stock_in: 0, stock_out: 0 });
  expect(res.body.data[4]).toEqual({ ym: '2025-12', month: 'Dec 2025', stock_in: 12, stock_out: 4 });
  expect(res.body.data[5].stock_out).toBe(0);
});

test.each([[[]], [[{ total_stock: 20, low_stock: 1 }]]])('shouldReturnSummary %j', async (rows) => {
  replies(rows); expect((await invoke(c.getSummary)).res.body.data).toEqual(rows[0] || {});
  expect(db.query.mock.calls[0][0]).toContain('pb.available_quantity > 0');
});

test('shouldCombineSummaryAndChart', async () => {
  replies([{ total_stock: 0 }], []);
  const { res } = await invoke(c.getOverview);
  expect(res.body.data.summary).toEqual({ total_stock: 0 });
  expect(res.body.data.stock_in_out_chart).toHaveLength(6);
  expect(res.body.data.stock_in_out_chart.every(row => row.stock_in === 0 && row.stock_out === 0)).toBe(true);
});

test.each(Object.keys(c))('shouldForwardDashboardDatabaseError %s', async (name) => {
  const error = new Error('database failed'); db.__setQueryError(error);
  expect((await invoke(c[name])).next).toHaveBeenCalledWith(error);
});
