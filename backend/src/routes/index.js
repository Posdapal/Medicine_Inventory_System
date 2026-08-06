const router = require('express').Router();
const { verifyToken, requirePasswordChanged } = require('../middleware/auth.middleware');

router.use('/auth', require('./auth.routes'));
router.use(verifyToken, requirePasswordChanged);
router.use('/dashboard', require('./dashboard.routes'));
router.use('/patients', require('./patients.routes'));
router.use('/medicines', require('./medicines.routes'));
router.use('/suppliers', require('./suppliers.routes'));
router.use('/categories', require('./categories.routes'));
router.use('/products', require('./products.routes'));
router.use('/prescriptions', require('./prescriptions.routes'));
router.use('/reports', require('./reports.routes'));
router.use('/users', require('./users.routes'));
router.use('/settings', require('./settings.routes'));

module.exports = router;
