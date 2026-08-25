const https = require('https');
const { query } = require('../utils/helper');

const escapeHtml = (value) => String(value ?? '—')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

function sendTelegramMessage(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return Promise.reject(new Error('Telegram credentials are not configured'));

  const payload = JSON.stringify({
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  });

  return new Promise((resolve, reject) => {
    const request = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${token}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
      timeout: 15000,
    }, (response) => {
      let body = '';
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => {
        if (response.statusCode >= 200 && response.statusCode < 300) return resolve();
        reject(new Error(`Telegram returned HTTP ${response.statusCode}: ${body.slice(0, 200)}`));
      });
    });
    request.on('timeout', () => request.destroy(new Error('Telegram request timed out')));
    request.on('error', reject);
    request.end(payload);
  });
}

async function loadUrgentExpiryBatches() {
  return query(
    `SELECT p.product_name AS product, pb.batch_number, pb.expiry_date,
            DATEDIFF(pb.expiry_date, CURDATE()) AS days_remaining,
            pb.available_quantity, pb.purchase_price, u.name AS unit,
            p.minimum_stock,
            (SELECT COALESCE(SUM(active_pb.available_quantity), 0)
               FROM product_batches active_pb
              WHERE active_pb.product_id = p.id AND active_pb.status = 'active') AS total_product_stock,
            (SELECT s.supplier_name
               FROM stock_transaction_items sti
               JOIN stock_transactions st ON st.id = sti.stock_transaction_id
               LEFT JOIN suppliers s ON s.id = st.supplier_id
              WHERE sti.batch_id = pb.id AND st.transaction_type = 'stock_in' AND st.status = 'completed'
              ORDER BY st.transaction_date DESC, st.id DESC LIMIT 1) AS supplier
       FROM product_batches pb
       JOIN products p ON p.id = pb.product_id
       LEFT JOIN units u ON u.id = p.unit_id
      WHERE p.status = 'active' AND pb.status = 'active' AND pb.available_quantity > 0
        AND pb.expiry_date IS NOT NULL
        AND DATEDIFF(pb.expiry_date, CURDATE()) BETWEEN 0 AND 7
      ORDER BY pb.expiry_date ASC, pb.available_quantity DESC`
  );
}

function batchFlags(batch) {
  const highValueThreshold = Number(process.env.EXPIRY_HIGH_VALUE_THRESHOLD || 1000);
  const largeQuantityThreshold = Number(process.env.EXPIRY_LARGE_QUANTITY_THRESHOLD || 100);
  const flags = [];
  const days = Number(batch.days_remaining);
  if (days === 0) flags.push('Expires today');
  else if (days <= 3) flags.push('Expires within 3 days');
  else flags.push('Expires within 7 days');
  if (Number(batch.available_quantity) * Number(batch.purchase_price) >= highValueThreshold) flags.push('High-value batch');
  if (Number(batch.available_quantity) >= largeQuantityThreshold) flags.push('Large remaining quantity');
  if (Number(batch.total_product_stock) <= Number(batch.minimum_stock)) flags.push('Critical medicine stock level');
  return flags;
}

function formatBatch(batch) {
  const days = Number(batch.days_remaining);
  const expiryDate = batch.expiry_date instanceof Date
    ? batch.expiry_date.toISOString().slice(0, 10)
    : String(batch.expiry_date).slice(0, 10);
  return [
    '<b>⚠️ Medicine Expiry Alert</b>',
    `Product: <b>${escapeHtml(batch.product)}</b>`,
    `Batch: ${escapeHtml(batch.batch_number)}`,
    `Expiry Date: ${escapeHtml(expiryDate)}`,
    `Days Remaining: <b>${days}</b>`,
    `Available Quantity: ${escapeHtml(batch.available_quantity)} ${escapeHtml(batch.unit || 'units')}`,
    `Supplier: ${escapeHtml(batch.supplier || 'Not recorded')}`,
    `Reason: ${escapeHtml(batchFlags(batch).join(' • '))}`,
    '',
    '<b>Action Required:</b>',
    days <= 3 ? 'Prioritize this batch immediately or arrange return/disposal.' : 'Review usage and arrange transfer, return, or promotion.',
  ].join('\n');
}

async function sendDailyExpirySummary() {
  const batches = await loadUrgentExpiryBatches();
  const summaries = { today: 0, threeDays: 0, sevenDays: 0, highValue: 0, largeQuantity: 0, critical: 0 };
  for (const batch of batches) {
    const flags = batchFlags(batch);
    if (Number(batch.days_remaining) === 0) summaries.today += 1;
    else if (Number(batch.days_remaining) <= 3) summaries.threeDays += 1;
    else summaries.sevenDays += 1;
    if (flags.includes('High-value batch')) summaries.highValue += 1;
    if (flags.includes('Large remaining quantity')) summaries.largeQuantity += 1;
    if (flags.includes('Critical medicine stock level')) summaries.critical += 1;
  }

  const timeZone = process.env.EXPIRY_TIMEZONE || 'Asia/Phnom_Penh';
  const reportDate = new Intl.DateTimeFormat('en-CA', { timeZone, dateStyle: 'medium' }).format(new Date());
  const summary = [
    `<b>📊 Daily Medicine Expiry Summary — ${escapeHtml(reportDate)}</b>`,
    '',
    `Urgent batches: <b>${batches.length}</b>`,
    `Expires today: <b>${summaries.today}</b>`,
    `Expires within 3 days: <b>${summaries.threeDays}</b>`,
    `Expires within 7 days: <b>${summaries.sevenDays}</b>`,
    `High-value batches: <b>${summaries.highValue}</b>`,
    `Large remaining quantities: <b>${summaries.largeQuantity}</b>`,
    `Critical stock medicines: <b>${summaries.critical}</b>`,
  ].join('\n');
  await sendTelegramMessage(summary);

  for (const batch of batches) await sendTelegramMessage(formatBatch(batch));
  return { total: batches.length, ...summaries };
}

module.exports = { sendDailyExpirySummary, loadUrgentExpiryBatches };
