const router = require('express').Router();
const { setTarget, getStatus, checkAndNotify, getMonthSummary } = require('../controllers/budgetController');
const auth = require('../middleware/auth');

router.use(auth);
router.post('/target', setTarget);
router.get('/status', getStatus);
router.post('/check-notify', checkAndNotify);
router.get('/month-summary', getMonthSummary);

module.exports = router;
