const router = require('express').Router();
const { verifyToken } = require('../middleware/auth.middleware');
const c = require('../controllers/prescriptions.controller');

router.use(verifyToken);

router.get('/', c.getAll);
router.get('/:id', c.getById);
router.post('/', c.create);
router.patch('/:id/status', c.updateStatus);
router.delete('/:id', c.remove);

module.exports = router;
