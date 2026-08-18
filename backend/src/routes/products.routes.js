const router = require('express').Router();
const { verifyToken, checkPermission } = require('../middleware/auth.middleware');
const c = require('../controllers/products.controller');

router.use(verifyToken);


router.get('/', checkPermission('products', 'read'), c.getAll);
router.get('/:id', checkPermission('products', 'read'), c.getById);
router.post('/', checkPermission('products', 'create'), c.create);
router.put('/:id', checkPermission('products', 'update'), c.update);
router.delete('/:id', checkPermission('products', 'delete'), c.remove);

module.exports = router;
