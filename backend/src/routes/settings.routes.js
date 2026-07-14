const router = require('express').Router();
const { verifyToken } = require('../middleware/auth.middleware');
const c = require('../controllers/settings.controller');

router.use(verifyToken);

router.get('/', c.getMySettings);
router.put('/profile', c.updateProfile);
router.put('/preferences', c.updatePreferences);
router.put('/password', c.updatePassword);
router.put('/two-factor', c.updateTwoFactor);

module.exports = router;
