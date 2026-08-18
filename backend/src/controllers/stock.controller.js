const { query, ok, fail, asyncHandler } = require('../utils/helper');

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

// Look up a product by id (preferred) or by product_name (what the Stock
// In / Stock Out forms submit, since they use a <select> of product names).
async function resolveProduct({ product_id, product }) {
  if (product_id) {
    const rows = await query('SELECT * FROM products WHERE id = ?', [product_id]);
    return rows[0] || null;
  }
  if (product) {
    const rows = await query('SELECT * FROM products WHERE product_name = ?', [product]);
    return rows[0] || null;
  }
  return null;
}

// Look up a supplier by id or by supplier_name (Stock In form sends a name).
async function resolveSupplier({ supplier_id, supplier }) {
  if (supplier_id) {
    const rows = await query('SELECT * FROM suppliers WHERE id = ?', [supplier_id]);
    return rows[0] || null;
  }
  if (supplier) {
    const rows = await query('SELECT * FROM suppliers WHERE supplier_name = ?', [supplier]);
    return rows[0] || null;
  }
  return null;
}

async function nextTransactionNumber(prefix) {
  const rows = await query(
    `SELECT transaction_number FROM stock_transactions
     WHERE transaction_number LIKE ?
     ORDER BY id DESC LIMIT 1`,
    [`${prefix}-%`]
  );
  let next = 1;
  if (rows[0]) {
    const n = parseInt(rows[0].transaction_number.split('-')[1], 10);
    if (!Number.isNaN(n)) next = n + 1;
  }
  return `${prefix}-${String(next).padStart(4, '0')}`;
}

// ----------------------------------------------------------------------------
// STOCK IN
// One "Stock In" record on the UI = one STOCK_TRANSACTIONS row carrying a
// single STOCK_TRANSACTION_ITEMS line, which receives (creates or tops up)
// one PRODUCT_BATCHES row.
// ----------------------------------------------------------------------------

// GET /api/stock/in?search=
const getStockIn = asyncHandler(async (req, res) => {
  const search = req.query.search ? `%${req.query.search}%` : '%';
  const rows = await query(
    `SELECT
       st.id, p.product_name AS product, s.supplier_name AS supplier,
       pb.batch_number, pb.manufacture_date, pb.expiry_date,
       sti.quantity AS received_quantity, sti.unit_price AS purchase_price,
       st.reference_number, st.transaction_date
     FROM stock_transactions st
     JOIN stock_transaction_items sti ON sti.stock_transaction_id = st.id
     JOIN products p ON p.id = sti.product_id
     JOIN product_batches pb ON pb.id = sti.batch_id
     LEFT JOIN suppliers s ON s.id = st.supplier_id
     WHERE st.transaction_type = 'stock_in'
       AND (p.product_name LIKE ? OR pb.batch_number LIKE ? OR st.reference_number LIKE ?)
     ORDER BY st.transaction_date DESC, st.id DESC`,
    [search, search, search]
  );
  return ok(res, rows);
});

// POST /api/stock/in
const createStockIn = asyncHandler(async (req, res) => {
  const {
    product, product_id, supplier, supplier_id,
    batch_number, manufacture_date, expiry_date,
    received_quantity, purchase_price,
    reference_number, transaction_date,
  } = req.body;

  const qty = Number(received_quantity);
  if (!batch_number || !qty || qty <= 0) {
    return fail(res, 'Batch number and a positive received quantity are required', 400);
  }

  const productRow = await resolveProduct({ product_id, product });
  if (!productRow) return fail(res, 'Product not found', 400);

  const supplierRow = await resolveSupplier({ supplier_id, supplier });

  const existingBatch = (
    await query('SELECT * FROM product_batches WHERE product_id = ? AND batch_number = ?', [productRow.id, batch_number])
  )[0];

  let batchId;
  let quantityBefore;
  let quantityAfter;

  if (existingBatch) {
    quantityBefore = existingBatch.available_quantity;
    quantityAfter = quantityBefore + qty;
    await query(
      `UPDATE product_batches
       SET received_quantity = received_quantity + ?, available_quantity = ?,
           manufacture_date = COALESCE(?, manufacture_date),
           expiry_date = COALESCE(?, expiry_date),
           purchase_price = ?, status = 'active'
       WHERE id = ?`,
      [qty, quantityAfter, manufacture_date || null, expiry_date || null, purchase_price || existingBatch.purchase_price, existingBatch.id]
    );
    batchId = existingBatch.id;
  } else {
    quantityBefore = 0;
    quantityAfter = qty;
    const batchResult = await query(
      `INSERT INTO product_batches
         (product_id, batch_number, manufacture_date, expiry_date, received_quantity, available_quantity, purchase_price, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
      [productRow.id, batch_number, manufacture_date || null, expiry_date || null, qty, qty, purchase_price || 0]
    );
    batchId = batchResult.insertId;
  }

  const transactionNumber = await nextTransactionNumber('STI');
  const txResult = await query(
    `INSERT INTO stock_transactions
       (supplier_id, created_by, transaction_number, transaction_type, transaction_date, reference_number, status)
     VALUES (?, ?, ?, 'stock_in', ?, ?, 'completed')`,
    [supplierRow ? supplierRow.id : null, req.user?.id || null, transactionNumber, transaction_date || new Date().toISOString().slice(0, 10), reference_number || null]
  );

  await query(
    `INSERT INTO stock_transaction_items (stock_transaction_id, product_id, batch_id, quantity, unit_price)
     VALUES (?, ?, ?, ?, ?)`,
    [txResult.insertId, productRow.id, batchId, qty, purchase_price || 0]
  );

  await query(
    `INSERT INTO stock_movements (product_id, batch_id, transaction_id, created_by, movement_type, quantity_before, movement_quantity, quantity_after)
     VALUES (?, ?, ?, ?, 'stock_in', ?, ?, ?)`,
    [productRow.id, batchId, txResult.insertId, req.user?.id || null, quantityBefore, qty, quantityAfter]
  );

  return ok(res, { id: txResult.insertId, transaction_number: transactionNumber }, 'Stock In recorded', 201);
});

// DELETE /api/stock/in/:id  (reverses the batch quantity it added, then removes the record)
const removeStockIn = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const items = await query(
    `SELECT sti.*, st.transaction_type FROM stock_transaction_items sti
     JOIN stock_transactions st ON st.id = sti.stock_transaction_id
     WHERE sti.stock_transaction_id = ?`,
    [id]
  );
  if (!items.length) return fail(res, 'Stock In record not found', 404);
  if (items[0].transaction_type !== 'stock_in') return fail(res, 'Not a Stock In record', 400);

  for (const item of items) {
    const batch = (await query('SELECT * FROM product_batches WHERE id = ?', [item.batch_id]))[0];
    if (batch) {
      const newAvailable = Math.max(0, batch.available_quantity - item.quantity);
      const newReceived = Math.max(0, batch.received_quantity - item.quantity);
      await query(
        'UPDATE product_batches SET available_quantity = ?, received_quantity = ? WHERE id = ?',
        [newAvailable, newReceived, batch.id]
      );
    }
  }

  await query('DELETE FROM stock_transactions WHERE id = ?', [id]);
  return ok(res, null, 'Stock In record removed');
});

// ----------------------------------------------------------------------------
// STOCK OUT
// One "Stock Out" record on the UI = one STOCK_TRANSACTIONS row carrying a
// single STOCK_TRANSACTION_ITEMS line, which draws down one PRODUCT_BATCHES
// row's available_quantity.
// ----------------------------------------------------------------------------

// GET /api/stock/out?search=
const getStockOut = asyncHandler(async (req, res) => {
  const search = req.query.search ? `%${req.query.search}%` : '%';
  const rows = await query(
    `SELECT
       st.id, p.product_name AS product, pb.batch_number,
       sti.quantity, st.reason, st.reference_number, st.transaction_date
     FROM stock_transactions st
     JOIN stock_transaction_items sti ON sti.stock_transaction_id = st.id
     JOIN products p ON p.id = sti.product_id
     JOIN product_batches pb ON pb.id = sti.batch_id
     WHERE st.transaction_type = 'stock_out'
       AND (p.product_name LIKE ? OR pb.batch_number LIKE ? OR st.reference_number LIKE ?)
     ORDER BY st.transaction_date DESC, st.id DESC`,
    [search, search, search]
  );
  return ok(res, rows);
});

// POST /api/stock/out
const createStockOut = asyncHandler(async (req, res) => {
  const {
    product, product_id, batch_number, batch_id,
    quantity, reason, reference_number, transaction_date,
  } = req.body;

  const qty = Number(quantity);
  if (!qty || qty <= 0) return fail(res, 'A positive quantity is required', 400);

  const productRow = await resolveProduct({ product_id, product });
  if (!productRow) return fail(res, 'Product not found', 400);

  let batch;
  if (batch_id) {
    batch = (await query('SELECT * FROM product_batches WHERE id = ? AND product_id = ?', [batch_id, productRow.id]))[0];
  } else if (batch_number) {
    batch = (await query('SELECT * FROM product_batches WHERE product_id = ? AND batch_number = ?', [productRow.id, batch_number]))[0];
  }
  if (!batch) return fail(res, 'Batch not found for this product', 400);
  if (batch.available_quantity < qty) {
    return fail(res, `Insufficient stock in batch ${batch.batch_number} (available: ${batch.available_quantity})`, 400);
  }

  const quantityBefore = batch.available_quantity;
  const quantityAfter = quantityBefore - qty;
  await query(
    'UPDATE product_batches SET available_quantity = ?, status = ? WHERE id = ?',
    [quantityAfter, quantityAfter === 0 ? 'depleted' : 'active', batch.id]
  );

  const transactionNumber = await nextTransactionNumber('STO');
  const txResult = await query(
    `INSERT INTO stock_transactions
       (supplier_id, created_by, transaction_number, transaction_type, transaction_date, reference_number, reason, status)
     VALUES (NULL, ?, ?, 'stock_out', ?, ?, ?, 'completed')`,
    [req.user?.id || null, transactionNumber, transaction_date || new Date().toISOString().slice(0, 10), reference_number || null, reason || 'Other']
  );

  await query(
    `INSERT INTO stock_transaction_items (stock_transaction_id, product_id, batch_id, quantity, unit_price)
     VALUES (?, ?, ?, ?, ?)`,
    [txResult.insertId, productRow.id, batch.id, qty, batch.purchase_price]
  );

  await query(
    `INSERT INTO stock_movements (product_id, batch_id, transaction_id, created_by, movement_type, quantity_before, movement_quantity, quantity_after)
     VALUES (?, ?, ?, ?, 'stock_out', ?, ?, ?)`,
    [productRow.id, batch.id, txResult.insertId, req.user?.id || null, quantityBefore, qty, quantityAfter]
  );

  return ok(res, { id: txResult.insertId, transaction_number: transactionNumber }, 'Stock Out recorded', 201);
});

// DELETE /api/stock/out/:id  (restores the batch quantity it removed, then removes the record)
const removeStockOut = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const items = await query(
    `SELECT sti.*, st.transaction_type FROM stock_transaction_items sti
     JOIN stock_transactions st ON st.id = sti.stock_transaction_id
     WHERE sti.stock_transaction_id = ?`,
    [id]
  );
  if (!items.length) return fail(res, 'Stock Out record not found', 404);
  if (items[0].transaction_type !== 'stock_out') return fail(res, 'Not a Stock Out record', 400);

  for (const item of items) {
    const batch = (await query('SELECT * FROM product_batches WHERE id = ?', [item.batch_id]))[0];
    if (batch) {
      const newAvailable = batch.available_quantity + item.quantity;
      await query(
        'UPDATE product_batches SET available_quantity = ?, status = ? WHERE id = ?',
        [newAvailable, 'active', batch.id]
      );
    }
  }

  await query('DELETE FROM stock_transactions WHERE id = ?', [id]);
  return ok(res, null, 'Stock Out record removed');
});

// ----------------------------------------------------------------------------
// CURRENT STOCK + HISTORY
// ----------------------------------------------------------------------------

// GET /api/stock/current?search=
const getCurrentStock = asyncHandler(async (req, res) => {
  const search = req.query.search ? `%${req.query.search}%` : '%';
  const rows = await query(
    `SELECT * FROM v_current_stock
     WHERE product_name LIKE ? OR product_code LIKE ?
     ORDER BY product_name`,
    [search, search]
  );
  return ok(res, rows);
});

// GET /api/stock/history?search=
const getStockHistory = asyncHandler(async (req, res) => {
  const search = req.query.search ? `%${req.query.search}%` : '%';
  const rows = await query(
    `SELECT * FROM v_stock_history
     WHERE product LIKE ? OR batch_number LIKE ?
     ORDER BY date DESC`,
    [search, search]
  );
  return ok(res, rows);
});

module.exports = {
  getStockIn, createStockIn, removeStockIn,
  getStockOut, createStockOut, removeStockOut,
  getCurrentStock, getStockHistory,
};
