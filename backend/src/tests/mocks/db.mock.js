function createDbMock() {
  let queryImpl = (sql, params, callback) => callback(null, []);

  const query = jest.fn((sql, params, callback) => {
    // node-mysql supports query(sql, callback) with no params too
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    return queryImpl(sql, params, callback);
  });

  return {
    query,
    connect: jest.fn((cb) => cb && cb(null)),
    beginTransaction: jest.fn((cb) => cb(null)),
    commit: jest.fn((cb) => cb(null)),
    rollback: jest.fn((cb) => cb(null)),

    // --- test helpers, not part of the real mysql API ---

    // Make every query resolve with the same rows/result, regardless of SQL.
    __setQueryResult(rowsOrResult) {
      queryImpl = (sql, params, callback) => callback(null, rowsOrResult);
    },

    // Make the next query() call fail with the given error.
    __setQueryError(err) {
      queryImpl = (sql, params, callback) => callback(err);
    },

    // Full control: provide your own (sql, params, callback) => void.
    __setQueryImpl(fn) {
      queryImpl = fn;
    },
  };
}

module.exports = createDbMock();
module.exports.createDbMock = createDbMock;
