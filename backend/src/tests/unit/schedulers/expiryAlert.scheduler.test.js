jest.mock('../../../services/telegramExpiryAlert.service', () => ({ sendDailyExpirySummary: jest.fn() }));
const { sendDailyExpirySummary } = require('../../../services/telegramExpiryAlert.service');
const { millisecondsUntilNextRun, startExpiryAlertScheduler } = require('../../../schedulers/expiryAlert.scheduler');
const originalEnv = { ...process.env };
beforeEach(() => {
  jest.useFakeTimers(); jest.setSystemTime(new Date('2026-09-10T00:00:00Z'));
  process.env.TELEGRAM_BOT_TOKEN = 'fake'; process.env.TELEGRAM_CHAT_ID = 'fake';
  delete process.env.EXPIRY_ALERT_HOUR; delete process.env.EXPIRY_TIMEZONE_OFFSET_HOURS; delete process.env.EXPIRY_TIMEZONE;
  jest.spyOn(console, 'log').mockImplementation(() => {}); jest.spyOn(console, 'warn').mockImplementation(() => {}); jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); process.env = { ...originalEnv }; });
test.each([
  ['2026-09-10T00:00:00Z', 8, 7, 3600000],
  ['2026-09-10T01:00:00Z', 8, 7, 86400000],
  ['2026-09-10T02:00:00Z', 8, 7, 82800000],
  ['2026-12-31T23:00:00Z', 8, 7, 7200000],
  ['2026-09-10T12:00:00Z', 8, -5, 3600000],
])('shouldCalculateNextRunAtBoundary %s', (now, hour, offset, expected) => {
  jest.setSystemTime(new Date(now)); expect(millisecondsUntilNextRun(hour, offset)).toBe(expected);
});
test.each(['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'])('shouldDisableSchedulerWithout %s', (key) => {
  delete process.env[key]; startExpiryAlertScheduler(); expect(jest.getTimerCount()).toBe(0); expect(console.warn).toHaveBeenCalled();
});
test('shouldSendAtScheduledTimeAndScheduleFollowingDay', async () => {
  sendDailyExpirySummary.mockResolvedValue({ total: 2 }); startExpiryAlertScheduler();
  await jest.advanceTimersByTimeAsync(3599999); expect(sendDailyExpirySummary).not.toHaveBeenCalled();
  await jest.advanceTimersByTimeAsync(1); expect(sendDailyExpirySummary).toHaveBeenCalledTimes(1); expect(jest.getTimerCount()).toBe(1);
  await jest.advanceTimersByTimeAsync(86400000); expect(sendDailyExpirySummary).toHaveBeenCalledTimes(2);
});
test('shouldRescheduleAfterFailureWithCustomTimezone', async () => {
  process.env.EXPIRY_ALERT_HOUR = '8'; process.env.EXPIRY_TIMEZONE_OFFSET_HOURS = '-5'; process.env.EXPIRY_TIMEZONE = 'America/Bogota';
  sendDailyExpirySummary.mockRejectedValue(new Error('API failed')); startExpiryAlertScheduler();
  await jest.advanceTimersByTimeAsync(13 * 3600000);
  expect(console.error).toHaveBeenCalledWith(expect.stringContaining('API failed')); expect(jest.getTimerCount()).toBe(1);
});
