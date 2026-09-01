const router = require('express').Router();
const { verifyToken, checkPermission } = require('../middleware/auth.middleware');
const c = require('../controllers/expiry.controller');

router.use(verifyToken);

router.get('/near', checkPermission('expiry', 'read'), c.getNearExpiry);
router.get('/expired', checkPermission('expiry', 'read'), c.getExpired);

module.exports = router;
