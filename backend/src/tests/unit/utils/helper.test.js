jest.mock('../../../src/config/db', () => require('../../mocks/db.mock'));

const { ok, fail, asyncHandler } = require('../../../src/utils/helper');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('ok()', () => {
  it('defaults to a 200 with success:true and the given data', () => {
    const res = mockRes();
    ok(res, { id: 1 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Success', data: { id: 1 } });
  });

  it('accepts a custom message and status code', () => {
    const res = mockRes();
    ok(res, { id: 1 }, 'Category created', 201);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Category created', data: { id: 1 } });
  });
});

describe('fail()', () => {
  it('defaults to a 500 with success:false', () => {
    const res = mockRes();
    fail(res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Something went wrong' })
    );
  });

  it('accepts a custom message, status, and errors payload', () => {
    const res = mockRes();
    fail(res, 'Category name is required', 400, { field: 'name' });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Category name is required',
      errors: { field: 'name' },
    });
  });
});

describe('asyncHandler()', () => {
  it('calls the wrapped handler with (req, res, next)', async () => {
    const handler = jest.fn().mockResolvedValue(undefined);
    const wrapped = asyncHandler(handler);
    const req = {}, res = {}, next = jest.fn();

    await wrapped(req, res, next);

    expect(handler).toHaveBeenCalledWith(req, res, next);
  });

  it('forwards a rejected promise to next(), instead of throwing', async () => {
    const boom = new Error('boom');
    const handler = jest.fn().mockRejectedValue(boom);
    const wrapped = asyncHandler(handler);
    const next = jest.fn();

    await wrapped({}, {}, next);

    expect(next).toHaveBeenCalledWith(boom);
  });

  it('forwards a synchronous throw to next() too', async () => {
    const boom = new Error('sync boom');
    const handler = jest.fn(async () => {
      throw boom;
    });
    const wrapped = asyncHandler(handler);
    const next = jest.fn();

    await wrapped({}, {}, next);

    expect(next).toHaveBeenCalledWith(boom);
  });
});
