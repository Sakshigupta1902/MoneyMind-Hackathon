const router = require('express').Router();
const { getWallet, redeemPoints } = require('../controllers/rewardController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/', getWallet);
router.post('/redeem', redeemPoints);

module.exports = router;
