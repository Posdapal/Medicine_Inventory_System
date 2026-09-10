// Only used by the existing HTTP-level controller tests; no server startup or migrations.
module.exports = function createApp() {
  const express = require('express');
  const app = express();
  app.use(express.json());
  app.use('/api/auth', require('../../routes/auth.routes'));
  const categories = require('../../controllers/categories.controller');
  app.get('/api/categories', categories.getAll);
  app.post('/api/categories', categories.create);
  app.put('/api/categories/:id', categories.update);
  app.delete('/api/categories/:id', categories.remove);
  app.use(require('../../middleware/errorHandler.middleware').errorHandler);
  return app;
};
