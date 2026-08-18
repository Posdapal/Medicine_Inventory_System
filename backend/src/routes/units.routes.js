const router = require('express').Router();
const { verifyToken } = require('../middleware/auth.middleware');
const c = require('../controllers/units.controller');

router.use(verifyToken);

router.get('/',  c.getAll);
router.post('/',  c.create);
router.put('/:id',  c.update);
router.delete('/:id',  c.remove);

module.exports = router;
