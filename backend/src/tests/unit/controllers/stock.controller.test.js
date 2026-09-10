const db = require('../../mocks/db.mock');
const { invoke, replies } = require('../../mocks/controller');
const c = require('../../../controllers/stock.controller');
const product = { id: 1, product_name: 'Medicine' };
const batch = { id: 3, batch_number: 'B1', available_quantity: 10, received_quantity: 20, purchase_price: 4, status: 'active' };
const input = { product_id: 1, batch_number: 'B1', received_quantity: 5, quantity: 5 };
const tx = { id: 7, transaction_date: '2026-09-01', reason: 'Other' };
const item = { id: 8, batch_id: 3, quantity: 4 };
const writes = () => db.query.mock.calls.filter(([sql]) => /^(UPDATE|INSERT|DELETE)/.test(sql.trim()));

beforeEach(() => { jest.useFakeTimers(); jest.setSystemTime(new Date('2026-09-10T12:00:00Z')); });
afterEach(() => jest.useRealTimers());

describe('Stock In', () => {
  test.each([undefined, 0, -1, 'invalid', ''])('shouldRejectInvalidReceivedQuantity %s', async (received_quantity) => {
    const { res } = await invoke(c.createStockIn, { body: { ...input, received_quantity } });
    expect(res.statusCode).toBe(400); expect(db.query).not.toHaveBeenCalled();
  });
  test('shouldRequireBatchNumber', async () => {
    expect((await invoke(c.createStockIn, { body: { received_quantity: 1 } })).res.statusCode).toBe(400);
  });
  test.each([{ product_id: 99 }, { product: 'Missing' }, {}])('shouldRejectMissingProduct %j', async (lookup) => {
    const { res } = await invoke(c.createStockIn, { body: { batch_number: 'B1', received_quantity: 1, ...lookup } });
    expect(res.body.message).toBe('Product not found'); expect(writes()).toHaveLength(0);
  });
  test('shouldIncreaseStockAfterStockIn', async () => {
    replies([product], [batch], {}, [{ transaction_number: 'STI-0009' }], { insertId: 12 }, {}, {});
    const { res, next } = await invoke(c.createStockIn, { body: input });
    expect(next).not.toHaveBeenCalled(); expect(res.statusCode).toBe(201);
    expect(res.body.data).toEqual({ id: 12, transaction_number: 'STI-0010' });
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('received_quantity = received_quantity + ?'), [5, 15, null, null, 4, 3], expect.any(Function));
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO stock_movements'), [1, 3, 12, 2, 10, 5, 15], expect.any(Function));
  });
  test.each(['STI-bad', null])('shouldCreateNewBatchAndStartSequence %s', async (previous) => {
    replies([product], [{ id: 9 }], [], { insertId: 3 }, previous ? [{ transaction_number: previous }] : [], { insertId: 12 }, {}, {});
    const { res, next } = await invoke(c.createStockIn, { body: { ...input, product_id: undefined, product: 'Medicine', supplier: 'Supplier', manufacture_date: '2026-01-01', expiry_date: '2027-01-01', purchase_price: 2, reference_number: 'R1', transaction_date: '2026-09-01' }, user: undefined });
    expect(next).not.toHaveBeenCalled(); expect(res.body.data.transaction_number).toBe('STI-0001');
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO product_batches'), [1, 'B1', '2026-01-01', '2027-01-01', 5, 5, 2], expect.any(Function));
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO stock_transactions'), [9, null, 'STI-0001', '2026-09-01', 'R1'], expect.any(Function));
  });
  test('shouldAllowUnresolvedOptionalSupplier', async () => {
    replies([product], [], [], { insertId: 3 }, [], { insertId: 12 }, {}, {});
    const { res } = await invoke(c.createStockIn, { body: { ...input, supplier_id: 99 } });
    expect(res.statusCode).toBe(201);
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO stock_transactions'), [null, 2, 'STI-0001', '2026-09-10', null], expect.any(Function));
  });
});

describe('Stock Out', () => {
  test.each([undefined, 0, -1, 'invalid'])('shouldRejectInvalidQuantity %s', async (quantity) => {
    const { res } = await invoke(c.createStockOut, { body: { ...input, quantity } });
    expect(res.statusCode).toBe(400); expect(db.query).not.toHaveBeenCalled();
  });
  test('shouldRejectUnknownProduct', async () => {
    expect((await invoke(c.createStockOut, { body: input })).res.body.message).toBe('Product not found');
  });
  test.each([{ batch_id: 99 }, { batch_number: 'missing' }, {}])('shouldRejectUnknownBatch %j', async (lookup) => {
    replies([product], []);
    const { res } = await invoke(c.createStockOut, { body: { product_id: 1, quantity: 1, ...lookup } });
    expect(res.body.message).toBe('Batch not found for this product'); expect(writes()).toHaveLength(0);
  });
  test.each([11, 100])('shouldRejectStockOutWhenQuantityExceedsAvailableStock %s', async (quantity) => {
    replies([product], [batch]);
    const { res } = await invoke(c.createStockOut, { body: { ...input, quantity } });
    expect(res.statusCode).toBe(400); expect(res.body.message).toMatch(/Insufficient stock/); expect(writes()).toHaveLength(0);
  });
  test.each([[5, 5, 'active'], [10, 0, 'depleted'], ['2', 8, 'active']])('shouldDecreaseStockAfterStockOut %s', async (quantity, remaining, status) => {
    replies([product], [batch], {}, [], { insertId: 12 }, {}, {});
    const { res, next } = await invoke(c.createStockOut, { body: { ...input, batch_id: 3, quantity } });
    expect(next).not.toHaveBeenCalled(); expect(res.statusCode).toBe(201);
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE product_batches'), [remaining, status, 3], expect.any(Function));
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO stock_movements'), [1, 3, 12, 2, 10, Number(quantity), remaining], expect.any(Function));
  });
  test('shouldRecordNamedBatchAndExplicitTransactionDetails', async () => {
    replies([product], [batch], {}, [{ transaction_number: 'STO-0099' }], { insertId: 12 }, {}, {});
    const { res } = await invoke(c.createStockOut, { body: { ...input, reason: 'Damaged', transaction_date: '2026-09-01', reference_number: 'R' }, user: undefined });
    expect(res.body.data.transaction_number).toBe('STO-0100');
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO stock_transactions'), [null, 'STO-0100', '2026-09-01', 'R', 'Damaged'], expect.any(Function));
  });
});

describe.each([['In', 'stock_in'], ['Out', 'stock_out']])('Stock %s reversals and adjustments', (suffix, type) => {
  test('shouldReturnNotFoundForMissingRemoval', async () => {
    expect((await invoke(c[`removeStock${suffix}`])).res.statusCode).toBe(404);
  });
  test('shouldRejectWrongTransactionType', async () => {
    replies([{ transaction_type: type === 'stock_in' ? 'stock_out' : 'stock_in' }]);
    expect((await invoke(c[`removeStock${suffix}`])).res.statusCode).toBe(400); expect(writes()).toHaveLength(0);
  });
  test('shouldReverseEachBatchAndSkipMissingBatch', async () => {
    replies([{ ...item, transaction_type: type }, { ...item, batch_id: 99 }], [batch], {}, [], {});
    const { res, next } = await invoke(c[`removeStock${suffix}`]);
    expect(next).not.toHaveBeenCalled(); expect(res.statusCode).toBe(200);
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE product_batches'), suffix === 'In' ? [6, 16, 3] : [14, 'active', 3], expect.any(Function));
    expect(db.query).toHaveBeenLastCalledWith('DELETE FROM stock_transactions WHERE id = ?', ['7'], expect.any(Function));
  });
  test('shouldRejectMissingAdjustmentQuantity', async () => {
    expect((await invoke(c[`updateStock${suffix}`])).res.statusCode).toBe(400); expect(writes()).toHaveLength(0);
  });
  test.each([[[], 404, 'record'], [[tx], 404, 'item']])('shouldRejectMissingAdjustmentDependency %j', async (first, status, message) => {
    replies(first, []);
    const { res } = await invoke(c[`updateStock${suffix}`], { body: input });
    expect(res.statusCode).toBe(status); expect(res.body.message).toContain(message);
  });
  test('shouldRejectMissingOriginalBatch', async () => {
    replies([tx], [item], []);
    expect((await invoke(c[`updateStock${suffix}`], { body: input })).res.body.message).toBe('Original batch not found');
  });
  test('shouldRejectMissingReplacementProduct', async () => {
    replies([tx], [item], [batch], []);
    expect((await invoke(c[`updateStock${suffix}`], { body: input })).res.body.message).toBe('Product not found');
    expect(writes()).toHaveLength(0);
  });
});

test.each([true, false])('shouldAdjustStockInToExistingOrNewBatch %s', async (existing) => {
  replies([tx], [item], [batch], [product], [{ id: 9 }], {}, existing ? [{ ...batch, available_quantity: 6 }] : [], { insertId: 3 }, {}, {}, {});
  const { res, next } = await invoke(c.updateStockIn, { body: { ...input, supplier_id: 9 } });
  expect(next).not.toHaveBeenCalled(); expect(res.statusCode).toBe(200);
  expect(db.query).toHaveBeenCalledWith(expect.stringContaining('SET available_quantity = ?, received_quantity'), [6, 16, 3], expect.any(Function));
  expect(db.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO stock_movements'), [1, 3, 7, 2, existing ? 6 : 0, 5, existing ? 11 : 5], expect.any(Function));
});
test.each([[null, 5], [batch, 15]])('shouldUndoRestoreWhenStockOutEditRejected %j', async (target, quantity) => {
  replies([tx], [item], [batch], [product], {}, target ? [target] : [], {});
  const { res } = await invoke(c.updateStockOut, { body: { ...input, quantity } });
  expect(res.statusCode).toBe(400);
  expect(db.query).toHaveBeenLastCalledWith(expect.stringContaining('UPDATE product_batches'), [10, 'active', 3], expect.any(Function));
});
test.each([[3, 14, 0, 'depleted'], [3, 5, 9, 'active'], [9, 5, 5, 'active']])('shouldAdjustStockOutAndAudit %s %s', async (id, quantity, after, status) => {
  replies([tx], [item], [batch], [product], {}, [{ ...batch, id }], {}, {}, {}, {});
  const { res, next } = await invoke(c.updateStockOut, { body: { ...input, batch_id: id, quantity } });
  expect(next).not.toHaveBeenCalled(); expect(res.statusCode).toBe(200);
  expect(db.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE product_batches'), [after, status, id], expect.any(Function));
  expect(db.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO stock_movements'), [1, id, 7, 2, id === 3 ? 14 : 10, quantity, after], expect.any(Function));
});

describe('Stock reads', () => {
  test.each(['getStockIn', 'getStockOut', 'getStockHistory'])('shouldReturnSearchResultsFor %s', async (name) => {
    const rows = [{ product: 'Medicine', batch_number: 'B1', quantity: 5 }]; replies(rows);
    const { res } = await invoke(c[name], { query: { search: 'Medicine', date: 'today' } });
    expect(res.body.data).toEqual(rows);
    const [sql, params] = db.query.mock.calls[0]; expect(params.every(p => p === '%Medicine%')).toBe(true);
    expect(sql).toContain(name === 'getStockHistory' ? 'ORDER BY date DESC' : 'st.transaction_date = CURDATE()');
  });
  test.each(['in_stock', 'low_stock', 'out_of_stock', 'unknown', undefined])('shouldApplyCurrentStockFilter %s', async (stock_status) => {
    replies([]); const { res } = await invoke(c.getCurrentStock, { query: { stock_status } });
    expect(res.body.data).toEqual([]);
    const sql = db.query.mock.calls[0][0];
    expect(sql).toContain("pb.status = 'active'"); expect(sql).toContain('COALESCE(SUM(');
    if (stock_status === 'low_stock') expect(sql).toContain('available_quantity <= current_stock.minimum_stock');
    if (stock_status === 'out_of_stock') expect(sql).toContain('current_stock.available_quantity = 0');
    if (stock_status === 'in_stock') expect(sql).toContain('current_stock.available_quantity > 0');
  });
});

describe('Database failures', () => {
  test.each(Object.keys(c))('shouldForwardDatabaseErrorFrom %s', async (name) => {
    const error = new Error('database unavailable'); db.__setQueryError(error);
    const { next, res } = await invoke(c[name], { body: input });
    expect(next).toHaveBeenCalledWith(error); expect(res.json).not.toHaveBeenCalled();
  });
  test.each([2, 3, 4, 5, 6])('shouldForwardStockOutWriteFailureAtQuery %s', async (index) => {
    const error = new Error('write failed');
    const results = [[product], [batch], {}, [], { insertId: 12 }, {}, {}]; results[index] = error;
    replies(...results);
    const { next, res } = await invoke(c.createStockOut, { body: input });
    expect(next).toHaveBeenCalledWith(error); expect(res.json).not.toHaveBeenCalled();
    expect(db.query).toHaveBeenCalledTimes(index + 1);
  });
});

test('shouldRestoreOriginalStockWhenEditHasNoTargetBatch', async () => {
  replies([tx], [item], [batch], [product], {}, {});
  const { res } = await invoke(c.updateStockOut, { body: { product_id: 1, quantity: 2 } });
  expect(res.statusCode).toBe(400);
  expect(db.query).toHaveBeenLastCalledWith(expect.stringContaining('UPDATE product_batches'), [10, 'active', 3], expect.any(Function));
});
test('shouldRecordExplicitStockOutAdjustmentDetailsWithoutUser', async () => {
  replies([tx], [item], [batch], [product], {}, [batch], {}, {}, {}, {});
  const { res } = await invoke(c.updateStockOut, { body: { ...input, reason: 'Damaged', reference_number: 'R2', transaction_date: '2026-09-09' }, user: undefined });
  expect(res.statusCode).toBe(200);
  expect(db.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE stock_transactions'), ['Damaged', 'R2', '2026-09-09', '7'], expect.any(Function));
  expect(db.query).toHaveBeenLastCalledWith(expect.stringContaining('INSERT INTO stock_movements'), [1, 3, 7, null, 14, 5, 9], expect.any(Function));
});
test('shouldRecordExplicitStockInAdjustmentDetailsWithoutSupplierOrUser', async () => {
  replies([tx], [item], [batch], [product], {}, [], { insertId: 9 }, {}, {}, {});
  const { res } = await invoke(c.updateStockIn, { body: { ...input, manufacture_date: '2026-01-01', expiry_date: '2027-01-01', purchase_price: 2, reference_number: 'R2', transaction_date: '2026-09-09' }, user: undefined });
  expect(res.statusCode).toBe(200);
  expect(db.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE stock_transactions'), [null, 'R2', '2026-09-09', '7'], expect.any(Function));
  expect(db.query).toHaveBeenLastCalledWith(expect.stringContaining('INSERT INTO stock_movements'), [1, 9, 7, null, 0, 5, 5], expect.any(Function));
});
test('shouldClampStockInReversalAtZeroAsCurrentlyImplemented', async () => {
  replies([{ ...item, quantity: 30, transaction_type: 'stock_in' }], [batch], {}, {});
  const { res } = await invoke(c.removeStockIn);
  expect(res.statusCode).toBe(200);
  expect(db.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE product_batches'), [0, 0, 3], expect.any(Function));
});

describe('Documented stock consistency defects (current behavior)', () => {
  test('shouldExposePersistedQuantityWhenLaterStockOutWriteFails', async () => {
    let available = 10;
    const error = new Error('transaction insert failed');
    db.__setQueryImpl((sql, params, callback) => {
      if (sql.includes('SELECT * FROM products')) return callback(null, [product]);
      if (sql.includes('SELECT * FROM product_batches')) return callback(null, [{ ...batch, available_quantity: available }]);
      if (sql.startsWith('UPDATE product_batches')) { available = params[0]; return callback(null, {}); }
      if (sql.includes('SELECT transaction_number')) return callback(null, []);
      return callback(error);
    });
    const { next } = await invoke(c.createStockOut, { body: input });
    expect(next).toHaveBeenCalledWith(error);
    // Characterizes the defect; desired atomic behavior would retain 10.
    expect(available).toBe(5); expect(db.beginTransaction).not.toHaveBeenCalled(); expect(db.rollback).not.toHaveBeenCalled();
  });
  test('shouldExposeAcceptedInfiniteStockInQuantity', async () => {
    replies([product], [], { insertId: 3 }, [], { insertId: 12 }, {}, {});
    const { res } = await invoke(c.createStockIn, { body: { ...input, received_quantity: 'Infinity' } });
    // The INT UNSIGNED database cannot persist this value; validation should reject it first.
    expect(res.statusCode).toBe(201);
    expect(db.query.mock.calls[2][1].slice(4, 6)).toEqual([Infinity, Infinity]);
  });
});
