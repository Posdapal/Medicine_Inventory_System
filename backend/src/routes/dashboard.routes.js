const router = require('express').Router();
const { verifyToken } = require('../middleware/auth.middleware');
const c = require('../controllers/dashboard.controller');

router.use(verifyToken);

router.get('/summary', c.getSummary);
router.get('/usage-chart', c.getUsageChart);
router.get('/stock-chart', c.getStockChart);
router.get('/low-stock', c.getLowStock);

module.exports = router;
