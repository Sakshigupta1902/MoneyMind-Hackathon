const router = require('express').Router();
const { saveNetWorth, getCurrent, getHistory } = require('../controllers/netWorthController');
const auth = require('../middleware/auth');

router.use(auth);
router.post('/',         saveNetWorth);
router.get('/current',   getCurrent);
router.get('/history',   getHistory);

module.exports = router;
