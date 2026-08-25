const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function millisecondsUntilNextRun(hour, timezoneOffsetHours) {
  const now = new Date();
  const localNow = new Date(now.getTime() + timezoneOffsetHours * 60 * 60 * 1000);
  let target = Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate(), hour - timezoneOffsetHours, 0, 0, 0);
  if (target <= now.getTime()) target += ONE_DAY_MS;
  return target - now.getTime();
}

function startExpiryAlertScheduler() {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    console.warn('Telegram expiry scheduler disabled: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing');
    return;
  }

  const hour = Number(process.env.EXPIRY_ALERT_HOUR || 8);
  const timezoneOffset = Number(process.env.EXPIRY_TIMEZONE_OFFSET_HOURS || 7);
  const timezoneName = process.env.EXPIRY_TIMEZONE || 'Asia/Phnom_Penh';

  const scheduleNext = () => {
    const delay = millisecondsUntilNextRun(hour, timezoneOffset);
    const nextRun = new Date(Date.now() + delay);
    console.log(`Telegram expiry alert scheduled for ${nextRun.toISOString()} (${hour}:00 ${timezoneName}, UTC${timezoneOffset >= 0 ? '+' : ''}${timezoneOffset})`);
    setTimeout(async () => {
      try {
        const { sendDailyExpirySummary } = require('../services/telegramExpiryAlert.service');
        const result = await sendDailyExpirySummary();
        console.log(`Telegram expiry summary sent for ${result.total} urgent batch(es)`);
      } catch (error) {
        console.error(`Telegram expiry alert failed: ${error.message}`);
      } finally {
        scheduleNext();
      }
    }, delay);
  };

  scheduleNext();
}

module.exports = { startExpiryAlertScheduler, millisecondsUntilNextRun };
