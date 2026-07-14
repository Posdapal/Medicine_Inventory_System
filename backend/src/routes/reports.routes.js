const router = require('express').Router();
const { verifyToken } = require('../middleware/auth.middleware');
const c = require('../controllers/reports.controller');

router.use(verifyToken);

// NOTE: /generate must be declared before /:id so it isn't swallowed by the param route
router.get('/generate', c.generate);
router.get('/', c.getAll);
router.get('/:id', c.getById);
router.post('/', c.save);

module.exports = router;
