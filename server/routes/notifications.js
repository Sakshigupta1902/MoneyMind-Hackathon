const router = require('express').Router();
const { getAll, markRead, markAllRead } = require('../controllers/notificationController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/', getAll);
router.put('/read-all', markAllRead);
router.put('/:id/read', markRead);

module.exports = router;
