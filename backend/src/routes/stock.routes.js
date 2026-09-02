const router = require('express').Router();
const { verifyToken, checkPermission } = require('../middleware/auth.middleware');
const c = require('../controllers/stock.controller');

router.use(verifyToken);

router.get('/in', checkPermission('stock', 'read'), c.getStockIn);
router.post('/in', checkPermission('stock', 'create'), c.createStockIn);
router.put("/in/:id", checkPermission("stock", "update"), c.updateStockIn);
router.delete('/in/:id', checkPermission('stock', 'delete'), c.removeStockIn);

router.get('/out', checkPermission('stock', 'read'), c.getStockOut);
router.post('/out', checkPermission('stock', 'create'), c.createStockOut);
router.put('/out/:id', checkPermission('stock', 'update'), c.updateStockOut);
router.delete('/out/:id', checkPermission('stock', 'delete'), c.removeStockOut);

router.get('/current', checkPermission('stock', 'read'), c.getCurrentStock);
router.get('/history', checkPermission('stock', 'read'), c.getStockHistory);

module.exports = router;
