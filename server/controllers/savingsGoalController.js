const SavingsGoal = require('../models/SavingsGoal');
const User = require('../models/User');

// Helper: days left
const daysLeft = (deadline) => Math.max(0, Math.ceil((new Date(deadline) - new Date()) / 86400000));

// Helper: daily saving needed
const dailySavingNeeded = (remaining, deadline) => {
  const days = daysLeft(deadline);
  return days > 0 ? Math.ceil(remaining / days) : 0;
};

// POST /api/goals
exports.createGoal = async (req, res) => {
  try {
    const { title, targetAmount, deadline, emoji, category } = req.body;
    const goal = await SavingsGoal.create({
      user: req.user.id, title, targetAmount, deadline, emoji, category,
    });
    res.status(201).json(goal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/goals
exports.getGoals = async (req, res) => {
  try {
    const goals = await SavingsGoal.find({ user: req.user.id }).sort({ createdAt: -1 });
    const user = await User.findById(req.user.id);

    const enriched = goals.map((g) => {
      const remaining = g.targetAmount - g.savedAmount;
      const pct = Math.min(Math.round((g.savedAmount / g.targetAmount) * 100), 100);
      const days = daysLeft(g.deadline);
      const dailyNeeded = dailySavingNeeded(remaining, g.deadline);
      const monthlyNeeded = dailyNeeded * 30;
      const canAfford = monthlyNeeded <= user.monthlyIncome * 0.3;

      return {
        ...g.toObject(),
        remaining,
        pct,
        daysLeft: days,
        dailyNeeded,
        monthlyNeeded,
        canAfford,
        isOverdue: days === 0 && !g.isCompleted,
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/goals/:id/contribute
exports.addContribution = async (req, res) => {
  try {
    const { amount, note } = req.body;
    const goal = await SavingsGoal.findOne({ _id: req.params.id, user: req.user.id });
    if (!goal) return res.status(404).json({ message: 'Goal nahi mila' });

    goal.contributions.push({ amount, note });
    goal.savedAmount = Math.min(goal.savedAmount + Number(amount), goal.targetAmount);
    if (goal.savedAmount >= goal.targetAmount) goal.isCompleted = true;
    await goal.save();

    res.json(goal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/goals/:id
exports.deleteGoal = async (req, res) => {
  try {
    await SavingsGoal.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ message: 'Goal delete ho gaya' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/goals/summary
exports.getSummary = async (req, res) => {
  try {
    const goals = await SavingsGoal.find({ user: req.user.id });
    const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
    const totalSaved = goals.reduce((s, g) => s + g.savedAmount, 0);
    const completed = goals.filter((g) => g.isCompleted).length;
    const active = goals.filter((g) => !g.isCompleted).length;

    res.json({ totalGoals: goals.length, totalTarget, totalSaved, completed, active,
      overallPct: totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
