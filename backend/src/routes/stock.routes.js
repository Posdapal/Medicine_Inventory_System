const router = require('express').Router();
const { verifyToken, checkPermission } = require('../middleware/auth.middleware');
const c = require('../controllers/stock.controller');

router.use(verifyToken);

router.get('/in', checkPermission('stock_in', 'read'), c.getStockIn);
router.post('/in', checkPermission('stock_in', 'create'), c.createStockIn);
router.delete('/in/:id', checkPermission('stock_in', 'delete'), c.removeStockIn);

router.get('/out', checkPermission('stock_out', 'read'), c.getStockOut);
router.post('/out', checkPermission('stock_out', 'create'), c.createStockOut);
router.delete('/out/:id', checkPermission('stock_out', 'delete'), c.removeStockOut);

router.get('/current', checkPermission('current_stock', 'read'), c.getCurrentStock);
router.get('/history', checkPermission('stock_history', 'read'), c.getStockHistory);

module.exports = router;
