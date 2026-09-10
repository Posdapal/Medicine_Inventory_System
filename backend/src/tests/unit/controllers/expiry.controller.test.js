jest.mock('../../../services/telegramExpiryAlert.service', () => ({ sendDailyExpirySummary: jest.fn() }));
const db = require('../../mocks/db.mock');
const { invoke, replies } = require('../../mocks/controller');
const c = require('../../../controllers/expiry.controller');
const { sendDailyExpirySummary } = require('../../../services/telegramExpiryAlert.service');

describe('Expiry database query contracts', () => {
  // MySQL owns date classification. Assert its predicates rather than reimplementing
  // a date filter in the mock and mistakenly claiming that tests the real SQL.
  test('shouldSelectExpiredBatchesStrictlyBeforeToday', async () => {
    replies([{ batch_number: 'EXPIRED', expiry_date: '2026-09-09', days_expired: 1 }]);
    const { res } = await invoke(c.getExpired);
    expect(res.body.data[0].days_expired).toBe(1);
    const sql = db.query.mock.calls[0][0];
    expect(sql).toContain('pb.expiry_date < CURDATE()');
    expect(sql).toContain("p.status = 'active' AND pb.status = 'active' AND pb.available_quantity > 0");
    expect(sql).toContain('ORDER BY pb.expiry_date DESC');
  });
  test('shouldIncludeTodayAndThirtyDayBoundaryAndExcludeLaterFutureDatesInQuery', async () => {
    const batches = [
      { batch_number: 'TODAY', expiry_date: '2026-09-10', days_remaining: 0 },
      { batch_number: 'NEAR', expiry_date: '2026-09-17', days_remaining: 7 },
      { batch_number: 'BOUNDARY', expiry_date: '2026-10-10', days_remaining: 30 },
    ]; replies(batches);
    const { res } = await invoke(c.getNearExpiry, { query: { search: 'Medicine' } });
    expect(res.body.data).toEqual(batches);
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('pb.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)'), ['%Medicine%', '%Medicine%'], expect.any(Function));
    expect(db.query.mock.calls[0][0]).toContain('ORDER BY pb.expiry_date ASC');
  });
  test.each(['getNearExpiry', 'getExpired'])('shouldReturnEmptyAndForwardErrors %s', async (name) => {
    expect((await invoke(c[name])).res.body.data).toEqual([]);
    const error = new Error('database failed'); replies(error);
    expect((await invoke(c[name], { query: { search: 'B' } })).next).toHaveBeenCalledWith(error);
  });
});

describe.each(['expiry', 'settings'])('%s manual Telegram trigger', (module) => {
  const controller = require(`../../../controllers/${module}.controller`);
  const originalEnv = { ...process.env };
  beforeEach(() => { process.env.TELEGRAM_BOT_TOKEN = 'fake-token'; process.env.TELEGRAM_CHAT_ID = 'fake-chat'; });
  afterEach(() => { process.env = { ...originalEnv }; });
  test.each(['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'])('shouldRejectMissingCredential %s', async (key) => {
    delete process.env[key];
    expect((await invoke(controller.triggerTelegramAlert)).res.statusCode).toBe(400);
    expect(sendDailyExpirySummary).not.toHaveBeenCalled();
  });
  test.each([0, 1, 2])('shouldReturnServiceSummary %s', async (total) => {
    sendDailyExpirySummary.mockResolvedValue({ total });
    const { res } = await invoke(controller.triggerTelegramAlert);
    expect(res.body.data).toEqual({ total }); expect(res.body.message).toContain(`${total} urgent batch${total === 1 ? '' : 'es'}`);
  });
  test('shouldReportTelegramServiceFailure', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    sendDailyExpirySummary.mockRejectedValue(new Error('API unavailable'));
    const { res } = await invoke(controller.triggerTelegramAlert);
    expect(res.statusCode).toBe(500); expect(res.body.message).toContain('API unavailable');
  });
});
