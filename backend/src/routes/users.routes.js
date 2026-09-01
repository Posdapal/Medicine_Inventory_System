const router = require('express').Router();
const { verifyToken, checkPermission } = require('../middleware/auth.middleware');
const c = require('../controllers/users.controller');

// User Management is admin-only across the board
router.use(verifyToken);

router.get('/', checkPermission('users','read'), c.getAll);
router.get('/:id', checkPermission('users','read'), c.getById);
router.post('/', checkPermission('users','create'), c.create);
router.put('/:id', checkPermission('users','update'), c.update);
router.delete('/:id', checkPermission('users','delete'), c.remove);

module.exports = router;
