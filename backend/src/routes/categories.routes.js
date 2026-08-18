const router = require('express').Router();
const { verifyToken, checkPermission } = require('../middleware/auth.middleware');
const c = require('../controllers/categories.controller');

router.use(verifyToken);

router.get('/', checkPermission('categories', 'read'), c.getAll);
router.post('/', checkPermission('categories', 'create'), c.create);
router.put('/:id', checkPermission('categories', 'update'), c.update);
router.delete('/:id', checkPermission('categories', 'delete'), c.remove);

module.exports = router;
