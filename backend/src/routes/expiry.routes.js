const router = require('express').Router();
const { verifyToken, checkPermission } = require('../middleware/auth.middleware');
const c = require('../controllers/expiry.controller');

router.use(verifyToken);

router.get('/near', c.getNearExpiry);
router.get('/expired', c.getExpired);

module.exports = router;
