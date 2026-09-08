const { queryPage, ok, fail, asyncHandler } = require('../utils/helper');
const { sendDailyExpirySummary } = require('../services/telegramExpiryAlert.service');

// GET /api/expiry/near?search=
const getNearExpiry = asyncHandler(async (req, res) => {
  const search = req.query.search ? `%${req.query.search}%` : '%';
  const rows = await queryPage(req,
    `SELECT p.product_name AS product, pb.batch_number, pb.manufacture_date, pb.expiry_date,
            DATEDIFF(pb.expiry_date, CURDATE()) AS days_remaining, pb.available_quantity
       FROM product_batches pb
       JOIN products p ON p.id = pb.product_id
      WHERE p.status = 'active' AND pb.status = 'active' AND pb.available_quantity > 0
        AND pb.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        AND (p.product_name LIKE ? OR pb.batch_number LIKE ?)`,
    [search, search],
    'ORDER BY pb.expiry_date ASC'
  );
  return ok(res, rows);
});

// GET /api/expiry/expired?search=
const getExpired = asyncHandler(async (req, res) => {
  const search = req.query.search ? `%${req.query.search}%` : '%';
  const rows = await queryPage(req,
    `SELECT p.product_name AS product, pb.batch_number, pb.manufacture_date, pb.expiry_date,
            DATEDIFF(CURDATE(), pb.expiry_date) AS days_expired, pb.available_quantity
       FROM product_batches pb
       JOIN products p ON p.id = pb.product_id
      WHERE p.status = 'active' AND pb.status = 'active' AND pb.available_quantity > 0
        AND pb.expiry_date < CURDATE()
        AND (p.product_name LIKE ? OR pb.batch_number LIKE ?)`,
    [search, search],
    'ORDER BY pb.expiry_date DESC'
  );
  return ok(res, rows);
});

// POST /api/expiry/trigger-telegram
const triggerTelegramAlert = asyncHandler(async (req, res) => {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    return fail(res, 'Telegram credentials (TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID) are not configured in .env', 400);
  }

  try {
    const result = await sendDailyExpirySummary();
    return ok(res, result, `Telegram expiry alert sent successfully (${result.total} urgent batch${result.total === 1 ? '' : 'es'}).`);
  } catch (error) {
    console.error('Manual Telegram alert error:', error);
    return fail(res, `Failed to send Telegram alert: ${error.message}`, 500);
  }
});

module.exports = { getNearExpiry, getExpired, triggerTelegramAlert };

