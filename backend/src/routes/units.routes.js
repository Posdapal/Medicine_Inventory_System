const router = require('express').Router();
const { verifyToken, checkPermission } = require('../middleware/auth.middleware');
const c = require('../controllers/units.controller');

router.use(verifyToken);

router.get('/', checkPermission('units', 'read'), c.getAll);
router.post('/', checkPermission('units', 'create'), c.create);
router.put('/:id', checkPermission('units', 'update'), c.update);
router.delete('/:id', checkPermission('units', 'delete'), c.remove);

module.exports = router;
