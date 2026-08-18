const router = require('express').Router();
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');

router.use('/auth', require('./auth.routes'));
router.use('/dashboard', require('./dashboard.routes'));
router.use('/categories', require('./categories.routes'));
router.use('/units', require('./units.routes'));
router.use('/products', require('./products.routes'));
router.use('/suppliers', require('./suppliers.routes'));
router.use('/stock', require('./stock.routes'));
router.use('/expiry', require('./expiry.routes'));
router.use('/reports', require('./reports.routes'));
router.use('/settings', require('./settings.routes'));
router.use('/permissions', require('./permissions.routes'));
router.use('/users', verifyToken, requireAdmin, require('./users.routes'));

module.exports = router;
