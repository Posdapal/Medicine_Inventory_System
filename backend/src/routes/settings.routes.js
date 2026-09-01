const router = require('express').Router();
const { verifyToken, checkPermission } = require('../middleware/auth.middleware');
const c = require('../controllers/settings.controller');

router.use(verifyToken);

router.get('/', checkPermission('settings','read'), c.getMySettings);
router.put('/profile', checkPermission('settings','update'), c.updateProfile);
router.put('/preferences', checkPermission('settings','update'), c.updatePreferences);
router.put('/password', c.updatePassword);
router.put('/two-factor', checkPermission('settings','update'), c.updateTwoFactor);

module.exports = router;
