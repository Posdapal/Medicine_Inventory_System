const db = require('./db.mock');

function response() {
  const res = { statusCode: 200 };
  res.status = jest.fn((code) => { res.statusCode = code; return res; });
  res.json = jest.fn((body) => { res.body = body; return res; });
  return res;
}

async function invoke(handler, input = {}) {
  const req = { body: {}, query: {}, params: { id: '7' }, headers: {}, user: { id: 2 }, ...input };
  const res = response();
  const next = jest.fn();
  await handler(req, res, next);
  return { req, res, next };
}

// An ordered database script fails loudly on unexpected extra queries.
function replies(...results) {
  db.__setQueryImpl((sql, params, callback) => {
    if (!results.length) return callback(new Error(`Unexpected query: ${sql}`));
    const result = results.shift();
    callback(result instanceof Error ? result : null, result instanceof Error ? undefined : result);
  });
}

module.exports = { response, invoke, replies };
