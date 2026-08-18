const router = require('express').Router();
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');
const c = require('../controllers/permissions.controller');

// Only admins can view or change any user's module permissions
router.use(verifyToken, requireAdmin);

router.get('/:userId', c.getForUser);
router.put('/:userId', c.updateForUser);

module.exports = router;
