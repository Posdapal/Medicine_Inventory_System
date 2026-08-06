const router = require('express').Router();
const { login, changePassword, profile } = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.post('/login', login);
router.post('/change-password', verifyToken, changePassword);
router.get('/profile', verifyToken, profile);
router.get('/me', verifyToken, profile);

module.exports = router;
