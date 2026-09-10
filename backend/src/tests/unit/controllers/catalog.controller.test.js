const db = require('../../mocks/db.mock');
const { invoke, replies } = require('../../mocks/controller');

describe.each([
  ['products', { product_code: 'P1', product_name: 'Medicine' }, true, [null, null, 'P1', 'Medicine', null, 0, 'active']],
  ['categories', { name: 'Medicine' }, false, ['Medicine', null, 'active']],
  ['units', { name: 'Tablet' }, true, ['Tablet', null]],
  ['suppliers', { supplier_code: 'S1', supplier_name: 'Supplier' }, false, ['S1', 'Supplier', null, null, null, null, 'active']],
])('%s catalog', (module, body, deduplicates, defaults) => {
  const c = require(`../../../controllers/${module}.controller`);
  test.each(['create', 'update'])('shouldRejectMissingRequiredFieldsFor %s', async (method) => {
    const { res } = await invoke(c[method]);
    expect(res.statusCode).toBe(400); expect(db.query).not.toHaveBeenCalled();
  });
  test.each(Object.keys(body))('shouldRequire %s', async (field) => {
    const incomplete = { ...body }; delete incomplete[field];
    const { res } = await invoke(c.create, { body: incomplete });
    expect(res.statusCode).toBe(400); expect(db.query).not.toHaveBeenCalled();
  });
  test('shouldCreateSuccessfullyWithDefaults', async () => {
    replies(...(deduplicates ? [[]] : []), { insertId: 42 });
    const { res, next } = await invoke(c.create, { body });
    expect(next).not.toHaveBeenCalled(); expect(res.statusCode).toBe(201); expect(res.body.data).toEqual({ id: 42 });
    expect(db.query).toHaveBeenLastCalledWith(expect.stringContaining(`INSERT INTO ${module}`), defaults, expect.any(Function));
  });
  test('shouldUpdateSuccessfullyWithDefaults', async () => {
    replies(...(deduplicates ? [[]] : []), { affectedRows: 1 });
    const { res } = await invoke(c.update, { body });
    expect(res.statusCode).toBe(200); expect(res.body.message).toMatch(/updated/);
    expect(db.query).toHaveBeenLastCalledWith(expect.stringContaining(`UPDATE ${module}`), [...defaults, '7'], expect.any(Function));
  });
  test('shouldDeleteById', async () => {
    replies({ affectedRows: 1 });
    const { res } = await invoke(c.remove);
    expect(res.body.message).toMatch(/deleted/);
    expect(db.query).toHaveBeenCalledWith(`DELETE FROM ${module} WHERE id = ?`, ['7'], expect.any(Function));
  });
  test.each([{}, { search: 'med', status: 'active', category_id: '2' }])('shouldListWithFilters %j', async (query) => {
    const rows = [{ id: 1, ...body }]; replies(rows);
    const { res } = await invoke(c.getAll, { query });
    expect(res.body.data).toEqual(rows);
    if (query.search) expect(db.query.mock.calls[0][1]).toContain('%med%');
    if (query.status && module !== 'units') expect(db.query.mock.calls[0][1]).toContain('active');
  });
  if (deduplicates) {
    test.each(['create', 'update'])('shouldRejectDuplicateFor %s', async (method) => {
      replies([{ id: 5, product_name: 'Existing' }]);
      const { res } = await invoke(c[method], { body });
      expect(res.statusCode).toBe(409); expect(db.query).toHaveBeenCalledTimes(1);
      if (method === 'update') expect(db.query.mock.calls[0][0]).toContain('AND id <> ?');
    });
    test('shouldRejectWhitespaceName', async () => {
      const whitespace = Object.fromEntries(Object.keys(body).map(key => [key, '   ']));
      expect((await invoke(c.create, { body: whitespace })).res.statusCode).toBe(400);
      expect(db.query).not.toHaveBeenCalled();
    });
    test('shouldForwardDuplicateLookupError', async () => {
      const error = new Error('lookup failed'); replies(error);
      expect((await invoke(c.create, { body })).next).toHaveBeenCalledWith(error);
    });
  }
  if (c.getById) {
    test('shouldReturnNotFound', async () => {
      expect((await invoke(c.getById)).res.statusCode).toBe(404);
    });
    test('shouldIncludeRelatedRecords', async () => {
      const related = [{ id: 9 }]; replies([{ id: 7, ...body }], related);
      const { res } = await invoke(c.getById);
      expect(res.body.data).toEqual({ id: 7, ...body, [module === 'products' ? 'batches' : 'recentDeliveries']: related });
    });
    test('shouldForwardRelatedRecordError', async () => {
      const error = new Error('related lookup failed'); replies([{ id: 7 }], error);
      expect((await invoke(c.getById)).next).toHaveBeenCalledWith(error);
    });
  }
  test.each(Object.keys(c))('shouldForwardDatabaseErrorFor %s', async (method) => {
    const error = new Error('database unavailable'); db.__setQueryError(error);
    const { next, res } = await invoke(c[method], { body });
    expect(next).toHaveBeenCalledWith(error); expect(res.json).not.toHaveBeenCalled();
  });
  test.each(['create', 'update'])('shouldForwardWriteErrorFor %s', async (method) => {
    const error = new Error('constraint failed'); replies(...(deduplicates ? [[]] : []), error);
    expect((await invoke(c[method], { body })).next).toHaveBeenCalledWith(error);
  });
});

test('shouldNormalizeProductFieldsAndPreserveExplicitValues', async () => {
  replies([], { insertId: 1 });
  const { res } = await invoke(require('../../../controllers/products.controller').create, { body: { product_code: ' P1 ', product_name: ' Medicine ', generic_name: ' Generic ', category_id: 2, unit_id: 3, minimum_stock: 10, status: 'inactive' } });
  expect(res.statusCode).toBe(201);
  expect(db.query).toHaveBeenLastCalledWith(expect.any(String), [2, 3, 'P1', 'Medicine', 'Generic', 10, 'inactive'], expect.any(Function));
});
test('shouldNormalizeUnitAbbreviation', async () => {
  replies([], { affectedRows: 1 });
  await invoke(require('../../../controllers/units.controller').update, { body: { name: ' Tablet ', abbreviation: ' tab ' } });
  expect(db.query).toHaveBeenLastCalledWith(expect.any(String), ['Tablet', 'tab', '7'], expect.any(Function));
});
test('shouldPreserveSupplierContactDetails', async () => {
  replies({ affectedRows: 1 });
  await invoke(require('../../../controllers/suppliers.controller').update, { body: { supplier_code: 'S', supplier_name: 'Supplier', contact_name: 'Contact', phone: '123', email: 'test@example.com', address: 'Clinic', status: 'inactive' } });
  expect(db.query).toHaveBeenLastCalledWith(expect.any(String), ['S', 'Supplier', 'Contact', '123', 'test@example.com', 'Clinic', 'inactive', '7'], expect.any(Function));
});
