const router = require('express').Router();
const { verifyToken, checkPermission } = require('../middleware/auth.middleware');
const c = require('../controllers/reports.controller');

router.use(verifyToken);

// NOTE: /generate must be declared before /:id so it isn't swallowed by the param route
router.get('/generate', checkPermission('reports', 'read'), c.generate);
router.get('/', checkPermission('reports', 'read'), c.getAll);
router.get('/:id', checkPermission('reports', 'read'), c.getById);
router.post('/', checkPermission('reports', 'create'), c.save);

module.exports = router;
