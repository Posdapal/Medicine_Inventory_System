const router = require('express').Router();
const { verifyToken } = require('../middleware/auth.middleware');
const c = require('../controllers/permissions.controller');

router.use(verifyToken);

router.get('/me', c.getMine);

module.exports = router;
