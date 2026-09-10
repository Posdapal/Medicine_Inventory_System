const { response } = require('../../mocks/controller');
const { notFound, errorHandler, duplicateMessage } = require('../../../middleware/errorHandler.middleware');
beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
test('shouldReturnRouteNotFound', () => {
  const res = response(); notFound({ originalUrl: '/api/missing' }, res, jest.fn());
  expect(res.statusCode).toBe(404); expect(res.body.message).toBe('Route /api/missing not found');
});
test.each([
  ['uq_users_username', 'This username is already in use.'], ['uq_users_email', 'This email address is already in use.'],
  ['uq_products_code', 'A product with this code already exists.'], ['uq_units_name', 'A unit with this name already exists.'],
  ['uq_batches_product_batch', 'This batch number already exists for the selected product.'],
])('shouldMapDuplicateConstraint %s', (constraint, message) => {
  const res = response(); errorHandler({ code: 'ER_DUP_ENTRY', sqlMessage: `Duplicate entry for key ${constraint}` }, {}, res, jest.fn());
  expect(res.statusCode).toBe(409); expect(res.body.message).toBe(message);
});
test('shouldHandleNumericDuplicateCodeAndUnknownConstraint', () => {
  const res = response(); errorHandler({ errno: 1062, message: 'unknown key' }, {}, res, jest.fn());
  expect(res.statusCode).toBe(409); expect(res.body.message).toContain('Please use a different value');
  expect(duplicateMessage({})).toContain('Please use a different value');
});
test.each([[{}, 500, 'Internal server error'], [{ message: 'bad', status: 400 }, 400, 'bad'], [{ sqlMessage: 'driver failed', message: 'generic' }, 500, 'driver failed']])('shouldReturnErrorEnvelope %j', (error, status, message) => {
  const res = response(); errorHandler(error, {}, res, jest.fn());
  expect(res.statusCode).toBe(status); expect(res.body).toEqual({ success: false, message });
});
