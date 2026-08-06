// 1. ALWAYS load dotenv at the absolute top of your entry file
require('dotenv').config();

const express = require('express');
const cors = require('cors');

// 2. Import your db configuration to establish the connection
const db = require('./src/config/db');
const routes = require('./src/routes');
const { notFound, errorHandler } = require('./src/middleware/errorHandler.middleware');

const app = express();
app.use(cors());
app.use(express.json({ limit: '8mb' }));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Medicine Inventory System API is running' });
});

app.use('/api', routes);

// 404 + centralized error handling (always last)
app.use(notFound);
app.use(errorHandler);

// 3. Fallback safely to 8081 if process.env.PORT fails to load
const PORT = process.env.PORT || 8081;

app.listen(PORT, () => {
  console.log(`Server Running on port ${PORT}`);
});
