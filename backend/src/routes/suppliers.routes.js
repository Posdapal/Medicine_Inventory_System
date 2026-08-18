 const router = require('express').Router();
const { verifyToken, checkPermission } = require('../middleware/auth.middleware');
const c = require('../controllers/suppliers.controller');

router.use(verifyToken);

router.get('/', checkPermission('suppliers', 'read'), c.getAll);
router.get('/:id', checkPermission('suppliers', 'read'), c.getById);
router.post('/', checkPermission('suppliers', 'create'), c.create);
router.put('/:id', checkPermission('suppliers', 'update'), c.update);
router.delete('/:id', checkPermission('suppliers', 'delete'), c.remove);

module.exports = router;
