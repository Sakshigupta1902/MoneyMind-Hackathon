const router = require('express').Router();
const { createGoal, getGoals, addContribution, deleteGoal, getSummary } = require('../controllers/savingsGoalController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/summary', getSummary);
router.get('/', getGoals);
router.post('/', createGoal);
router.post('/:id/contribute', addContribution);
router.delete('/:id', deleteGoal);

module.exports = router;
