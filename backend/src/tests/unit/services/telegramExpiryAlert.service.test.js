const { EventEmitter } = require('events');
const https = require('https');
const db = require('../../mocks/db.mock');
const { replies } = require('../../mocks/controller');
const { sendDailyExpirySummary, loadUrgentExpiryBatches } = require('../../../services/telegramExpiryAlert.service');
const originalEnv = { ...process.env };
let payloads;

function mockApi(statusCode = 200, failure) {
  https.request.mockImplementation((options, callback) => {
    const req = new EventEmitter();
    req.destroy = jest.fn(error => req.emit('error', error));
    req.end = jest.fn(payload => {
      payloads.push(JSON.parse(payload));
      if (failure === 'timeout') return req.emit('timeout');
      if (failure) return req.emit('error', new Error(failure));
      const response = new EventEmitter(); response.statusCode = statusCode;
      callback(response); response.emit('data', '{"ok":'); response.emit('data', 'true}'); response.emit('end');
    });
    return req;
  });
}
beforeEach(() => {
  process.env.TELEGRAM_BOT_TOKEN = 'fake-token'; process.env.TELEGRAM_CHAT_ID = 'fake-chat';
  delete process.env.EXPIRY_HIGH_VALUE_THRESHOLD; delete process.env.EXPIRY_LARGE_QUANTITY_THRESHOLD; delete process.env.EXPIRY_TIMEZONE;
  payloads = []; mockApi(); jest.useFakeTimers(); jest.setSystemTime(new Date('2026-09-10T12:00:00Z'));
});
afterEach(() => { process.env = { ...originalEnv }; jest.useRealTimers(); });
const batch = { product: 'Medicine', batch_number: 'B1', expiry_date: '2026-09-10', days_remaining: 0, available_quantity: 100, purchase_price: 10, total_product_stock: 100, minimum_stock: 100 };

test('shouldQueryOnlyActivePositiveBatchesFromTodayThroughSevenDays', async () => {
  replies([batch]); await expect(loadUrgentExpiryBatches()).resolves.toEqual([batch]);
  const sql = db.query.mock.calls[0][0];
  expect(sql).toContain('DATEDIFF(pb.expiry_date, CURDATE()) BETWEEN 0 AND 7');
  expect(sql).toContain('pb.expiry_date IS NOT NULL'); expect(sql).toContain('pb.available_quantity > 0');
  expect(sql).toContain("p.status = 'active' AND pb.status = 'active'");
});
test('shouldSendOnlyDailySummaryWhenNoItemsExistAsCurrentlyDesigned', async () => {
  const result = await sendDailyExpirySummary();
  expect(result).toEqual({ total: 0, today: 0, threeDays: 0, sevenDays: 0, highValue: 0, largeQuantity: 0, critical: 0 });
  expect(payloads).toHaveLength(1); expect(payloads[0].text).toContain('Urgent batches: <b>0</b>');
});
test('shouldSummarizeMultipleBatchesAtTodayThreeAndSevenDayBoundaries', async () => {
  replies([batch, { ...batch, batch_number: 'B2', days_remaining: '3', expiry_date: new Date('2026-09-13T00:00:00Z'), unit: 'tablets', supplier: 'Supplier', available_quantity: 99, total_product_stock: 101 }, { ...batch, batch_number: 'B3', days_remaining: 7, available_quantity: 1, total_product_stock: 101 }]);
  const result = await sendDailyExpirySummary();
  expect(result).toEqual({ total: 3, today: 1, threeDays: 1, sevenDays: 1, highValue: 1, largeQuantity: 1, critical: 1 });
  expect(payloads).toHaveLength(4);
  expect(payloads[1].text).toContain('Expires today'); expect(payloads[2].text).toContain('Expires within 3 days'); expect(payloads[3].text).toContain('Expires within 7 days');
  expect(payloads[2].text).toContain('2026-09-13'); expect(payloads[3].text).toContain('Review usage');
  expect(payloads[1].text).toContain('Prioritize this batch');
});
test('shouldEscapeHtmlAndApplyCustomThresholds', async () => {
  process.env.EXPIRY_HIGH_VALUE_THRESHOLD = '20'; process.env.EXPIRY_LARGE_QUANTITY_THRESHOLD = '2'; process.env.EXPIRY_TIMEZONE = 'UTC';
  replies([{ ...batch, product: '<Medicine & Co>', batch_number: null, available_quantity: 2, purchase_price: 10 }]);
  expect((await sendDailyExpirySummary()).highValue).toBe(1);
  expect(payloads[1].text).toContain('&lt;Medicine &amp; Co&gt;'); expect(payloads[1].text).toContain('2 units');
  expect(payloads[1].text).toContain('Supplier: Not recorded');
  expect(https.request).toHaveBeenCalledWith(expect.objectContaining({ hostname: 'api.telegram.org', path: '/botfake-token/sendMessage', method: 'POST', timeout: 15000 }), expect.any(Function));
  expect(payloads[0]).toMatchObject({ chat_id: 'fake-chat', parse_mode: 'HTML', disable_web_page_preview: true });
});
test.each(['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'])('shouldRejectMissingCredentials %s', async (key) => {
  delete process.env[key]; await expect(sendDailyExpirySummary()).rejects.toThrow('credentials'); expect(https.request).not.toHaveBeenCalled();
});
test('shouldNotSendMessagesWhenDatabaseFails', async () => {
  const error = new Error('database failed'); replies(error);
  await expect(sendDailyExpirySummary()).rejects.toBe(error); expect(https.request).not.toHaveBeenCalled();
});
test.each([[400, undefined, 'HTTP 400'], [500, undefined, 'HTTP 500'], [200, 'network down', 'network down'], [200, 'timeout', 'timed out']])('shouldPropagateTelegramFailure %s %s', async (status, failure, message) => {
  mockApi(status, failure); replies([batch]);
  await expect(sendDailyExpirySummary()).rejects.toThrow(message); expect(https.request).toHaveBeenCalledTimes(1);
});
test('shouldStopSendingLaterBatchesAfterIndividualMessageFailure', async () => {
  replies([batch, batch]);
  const successfulRequest = https.request.getMockImplementation();
  https.request.mockImplementationOnce(successfulRequest).mockImplementation(() => { throw new Error('batch send failed'); });
  await expect(sendDailyExpirySummary()).rejects.toThrow('batch send failed'); expect(https.request).toHaveBeenCalledTimes(2);
});
