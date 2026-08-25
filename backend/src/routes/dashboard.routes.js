const router = require('express').Router();
const { verifyToken } = require('../middleware/auth.middleware');
const c = require('../controllers/dashboard.controller');

router.use(verifyToken);

router.get('/', c.getOverview);
router.get('/summary', c.getSummary);
router.get('/stock-in-out-chart', c.getStockInOutChart);

module.exports = router;
