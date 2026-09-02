const { query, queryPage, ok, fail, asyncHandler } = require('../utils/helper');

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
  const dateCondition = req.query.date === 'today' ? ' AND st.transaction_date = CURDATE()' : '';
  const rows = await queryPage(req,
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
       AND st.status = 'completed'
       ${dateCondition}
       AND (p.product_name LIKE ? OR pb.batch_number LIKE ? OR st.reference_number LIKE ?)`,
    [search, search, search], 'ORDER BY st.transaction_date DESC, st.id DESC'
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
  const dateCondition = req.query.date === 'today' ? ' AND st.transaction_date = CURDATE()' : '';
  const rows = await queryPage(req,
    `SELECT
       st.id, p.product_name AS product, pb.batch_number,
       sti.quantity, st.reason, st.reference_number, st.transaction_date
     FROM stock_transactions st
     JOIN stock_transaction_items sti ON sti.stock_transaction_id = st.id
     JOIN products p ON p.id = sti.product_id
     JOIN product_batches pb ON pb.id = sti.batch_id
     WHERE st.transaction_type = 'stock_out'
       AND st.status = 'completed'
       ${dateCondition}
       AND (p.product_name LIKE ? OR pb.batch_number LIKE ? OR st.reference_number LIKE ?)`,
    [search, search, search], 'ORDER BY st.transaction_date DESC, st.id DESC'
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
  const stockFilter = {
    in_stock: 'AND current_stock.available_quantity > 0',
    low_stock: 'AND current_stock.available_quantity > 0 AND current_stock.available_quantity <= current_stock.minimum_stock',
    out_of_stock: 'AND current_stock.available_quantity = 0',
  }[req.query.stock_status] || '';
  const rows = await queryPage(req,
    `SELECT * FROM (
       SELECT p.id, p.product_code, p.product_name, c.name AS category, u.name AS unit,
              COALESCE(SUM(CASE WHEN pb.status = 'active' THEN pb.available_quantity ELSE 0 END), 0) AS available_quantity,
              p.minimum_stock
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
         LEFT JOIN units u ON u.id = p.unit_id
         LEFT JOIN product_batches pb ON pb.product_id = p.id
        WHERE p.status = 'active'
        GROUP BY p.id, p.product_code, p.product_name, c.name, u.name, p.minimum_stock
     ) current_stock
     WHERE (current_stock.product_name LIKE ? OR current_stock.product_code LIKE ?)
     ${stockFilter}`,
    [search, search], 'ORDER BY product_name'
  );
  return ok(res, rows);
});

// GET /api/stock/history?search=
const getStockHistory = asyncHandler(async (req, res) => {
  const search = req.query.search ? `%${req.query.search}%` : '%';
  const rows = await queryPage(req,
    `SELECT * FROM v_stock_history
     WHERE product LIKE ? OR batch_number LIKE ?`,
    [search, search], 'ORDER BY date DESC'
  );
  return ok(res, rows);
});

// PUT /api/stock/in/:id
const updateStockIn = asyncHandler(async (req, res) => {
  const { id } = req.params;
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

  const tx = (
    await query(`SELECT * FROM stock_transactions WHERE id = ? AND transaction_type = 'stock_in'`, [id])
  )[0];
  if (!tx) return fail(res, 'Stock In record not found', 404);

  const item = (
    await query('SELECT * FROM stock_transaction_items WHERE stock_transaction_id = ?', [id])
  )[0];
  if (!item) return fail(res, 'Stock In item not found', 404);

  const oldBatch = (await query('SELECT * FROM product_batches WHERE id = ?', [item.batch_id]))[0];
  if (!oldBatch) return fail(res, 'Original batch not found', 400);

  const productRow = await resolveProduct({ product_id, product });
  if (!productRow) return fail(res, 'Product not found', 400);

  const supplierRow = await resolveSupplier({ supplier_id, supplier });

  // Step 1 — undo what this record originally added to its batch
  const revertedAvailable = Math.max(0, oldBatch.available_quantity - item.quantity);
  const revertedReceived = Math.max(0, oldBatch.received_quantity - item.quantity);
  await query(
    'UPDATE product_batches SET available_quantity = ?, received_quantity = ? WHERE id = ?',
    [revertedAvailable, revertedReceived, oldBatch.id]
  );

  // Step 2 — apply the new values to whichever batch they now target
  // (same product_id + batch_number as before => same batch, post-revert;
  //  a different batch_number/product => a different or brand-new batch)
  let targetBatch = (
    await query('SELECT * FROM product_batches WHERE product_id = ? AND batch_number = ?', [productRow.id, batch_number])
  )[0];

  let batchId, quantityBefore, quantityAfter;

  if (targetBatch) {
    quantityBefore = targetBatch.available_quantity;
    quantityAfter = quantityBefore + qty;
    await query(
      `UPDATE product_batches
       SET received_quantity = received_quantity + ?, available_quantity = ?,
           manufacture_date = COALESCE(?, manufacture_date),
           expiry_date = COALESCE(?, expiry_date),
           purchase_price = ?, status = 'active'
       WHERE id = ?`,
      [qty, quantityAfter, manufacture_date || null, expiry_date || null, purchase_price || targetBatch.purchase_price, targetBatch.id]
    );
    batchId = targetBatch.id;
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

  // Step 3 — update the transaction header
  await query(
    `UPDATE stock_transactions SET supplier_id = ?, reference_number = ?, transaction_date = ? WHERE id = ?`,
    [supplierRow ? supplierRow.id : null, reference_number || null, transaction_date || tx.transaction_date, id]
  );

  // Step 4 — update the line item
  await query(
    `UPDATE stock_transaction_items SET product_id = ?, batch_id = ?, quantity = ?, unit_price = ? WHERE id = ?`,
    [productRow.id, batchId, qty, purchase_price || 0, item.id]
  );

  // Step 5 — audit trail
  await query(
    `INSERT INTO stock_movements (product_id, batch_id, transaction_id, created_by, movement_type, quantity_before, movement_quantity, quantity_after)
     VALUES (?, ?, ?, ?, 'stock_in_adjustment', ?, ?, ?)`,
    [productRow.id, batchId, tx.id, req.user?.id || null, quantityBefore, qty, quantityAfter]
  );

  return ok(res, { id: tx.id }, 'Stock In record updated');
});

// PUT /api/stock/out/:id
const updateStockOut = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    product, product_id, batch_number, batch_id,
    quantity, reason, reference_number, transaction_date,
  } = req.body;

  const qty = Number(quantity);
  if (!qty || qty <= 0) return fail(res, 'A positive quantity is required', 400);

  const tx = (
    await query(`SELECT * FROM stock_transactions WHERE id = ? AND transaction_type = 'stock_out'`, [id])
  )[0];
  if (!tx) return fail(res, 'Stock Out record not found', 404);

  const item = (
    await query('SELECT * FROM stock_transaction_items WHERE stock_transaction_id = ?', [id])
  )[0];
  if (!item) return fail(res, 'Stock Out item not found', 404);

  const oldBatch = (await query('SELECT * FROM product_batches WHERE id = ?', [item.batch_id]))[0];
  if (!oldBatch) return fail(res, 'Original batch not found', 400);

  const productRow = await resolveProduct({ product_id, product });
  if (!productRow) return fail(res, 'Product not found', 400);

  // Step 1 — undo what this record originally drew down from its batch
  const restoredAvailable = oldBatch.available_quantity + item.quantity;
  await query(
    'UPDATE product_batches SET available_quantity = ?, status = ? WHERE id = ?',
    [restoredAvailable, 'active', oldBatch.id]
  );

  // Step 2 — resolve whichever batch the edited values now target
  // (could be the same batch, post-restore, or a different one)
  let targetBatch;
  if (batch_id) {
    targetBatch = (await query('SELECT * FROM product_batches WHERE id = ? AND product_id = ?', [batch_id, productRow.id]))[0];
  } else if (batch_number) {
    targetBatch = (await query('SELECT * FROM product_batches WHERE product_id = ? AND batch_number = ?', [productRow.id, batch_number]))[0];
  }
  if (!targetBatch) {
    // Roll the restore back before bailing, so a bad edit doesn't leave stock inflated
    await query(
      'UPDATE product_batches SET available_quantity = ?, status = ? WHERE id = ?',
      [oldBatch.available_quantity, oldBatch.status, oldBatch.id]
    );
    return fail(res, 'Batch not found for this product', 400);
  }

  // If target batch is the same row we just restored, re-read isn't needed —
  // but if it's a different batch, targetBatch.available_quantity is already current.
  const currentAvailable = targetBatch.id === oldBatch.id ? restoredAvailable : targetBatch.available_quantity;
  if (currentAvailable < qty) {
    await query(
      'UPDATE product_batches SET available_quantity = ?, status = ? WHERE id = ?',
      [oldBatch.available_quantity, oldBatch.status, oldBatch.id]
    );
    return fail(res, `Insufficient stock in batch ${targetBatch.batch_number} (available: ${currentAvailable})`, 400);
  }

  const quantityBefore = currentAvailable;
  const quantityAfter = quantityBefore - qty;
  await query(
    'UPDATE product_batches SET available_quantity = ?, status = ? WHERE id = ?',
    [quantityAfter, quantityAfter === 0 ? 'depleted' : 'active', targetBatch.id]
  );

  // Step 3 — update the transaction header
  await query(
    `UPDATE stock_transactions SET reason = ?, reference_number = ?, transaction_date = ? WHERE id = ?`,
    [reason || tx.reason, reference_number || null, transaction_date || tx.transaction_date, id]
  );

  // Step 4 — update the line item
  await query(
    `UPDATE stock_transaction_items SET product_id = ?, batch_id = ?, quantity = ?, unit_price = ? WHERE id = ?`,
    [productRow.id, targetBatch.id, qty, targetBatch.purchase_price, item.id]
  );

  // Step 5 — audit trail
  await query(
    `INSERT INTO stock_movements (product_id, batch_id, transaction_id, created_by, movement_type, quantity_before, movement_quantity, quantity_after)
     VALUES (?, ?, ?, ?, 'stock_out_adjustment', ?, ?, ?)`,
    [productRow.id, targetBatch.id, tx.id, req.user?.id || null, quantityBefore, qty, quantityAfter]
  );

  return ok(res, { id: tx.id }, 'Stock Out record updated');
});

module.exports = {
  getStockIn, createStockIn, updateStockIn, removeStockIn,
  getStockOut, createStockOut, updateStockOut, removeStockOut,
  getCurrentStock, getStockHistory,
};
