const router = require('express').Router();
const {
  addExpense,
  getExpenses,
  deleteExpense,
  getSummary,
  getAIPrediction,
  getAIFinancialPlan,
} = require('../controllers/expenseController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/summary', getSummary);
router.get('/ai-prediction', getAIPrediction);
router.post('/ai-plan', getAIFinancialPlan);
router.post('/', addExpense);
router.get('/', getExpenses);
router.delete('/:id', deleteExpense);

module.exports = router;
