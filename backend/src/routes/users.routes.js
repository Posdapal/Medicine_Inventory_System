const router = require('express').Router();
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');
const c = require('../controllers/users.controller');

// User Management is admin-only across the board
router.use(verifyToken, requireAdmin);

router.get('/', c.getAll);
router.get('/:id', c.getById);
router.post('/', c.create);
router.put('/:id', c.update);
router.delete('/:id', c.remove);

module.exports = router;
