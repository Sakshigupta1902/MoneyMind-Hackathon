const router = require('express').Router();
const {
  getRecommendation,
  getAIAdvice,
  calculateReturns,
  compareInstruments,
} = require('../controllers/investmentController');
const auth = require('../middleware/auth');

router.use(auth);
router.post('/recommend', getRecommendation);
router.post('/ai-advice', getAIAdvice);
router.post('/returns-calc', calculateReturns);
router.get('/compare', compareInstruments);

module.exports = router;
