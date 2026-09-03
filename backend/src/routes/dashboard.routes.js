const router = require('express').Router();
const { verifyToken, checkPermission } = require('../middleware/auth.middleware');
const c = require('../controllers/dashboard.controller');

router.use(verifyToken);

router.get('/', checkPermission('dashboard','read'), c.getOverview);
router.get('/summary', checkPermission('dashboard','read'), c.getSummary);
router.get('/stock-in-out-chart', checkPermission('dashboard','read'), c.getStockInOutChart);

module.exports = router;
