const UserReward = require('../models/UserReward');
const LessonProgress = require('../models/LessonProgress');

// Points to cashback rate: 50 points = ₹5
const POINTS_PER_RUPEE = 10;
const MIN_REDEEM = 50;

// GET /api/reward
exports.getWallet = async (req, res) => {
  try {
    let reward = await UserReward.findOne({ user: req.user.id });
    if (!reward) reward = await UserReward.create({ user: req.user.id });

    // Last 7 days lesson history
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const progress = await LessonProgress.findOne({ user: req.user.id, date: dateStr });
      last7.push({ date: dateStr, completed: !!progress?.answered, correct: !!progress?.correct, points: progress?.pointsEarned || 0 });
    }

    res.json({
      totalPoints: reward.totalPoints,
      lifetimePoints: reward.lifetimePoints,
      currentStreak: reward.currentStreak,
      lessonsCompleted: reward.lessonsCompleted,
      correctAnswers: reward.correctAnswers,
      badges: reward.badges,
      redeemHistory: reward.redeemHistory.slice(-5).reverse(),
      cashbackValue: Math.floor(reward.totalPoints / POINTS_PER_RUPEE),
      canRedeem: reward.totalPoints >= MIN_REDEEM,
      minRedeem: MIN_REDEEM,
      last7Days: last7,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/reward/redeem
exports.redeemPoints = async (req, res) => {
  try {
    const { points } = req.body;
    if (!points || points < MIN_REDEEM)
      return res.status(400).json({ message: `Minimum ${MIN_REDEEM} points chahiye redeem karne ke liye` });

    const reward = await UserReward.findOne({ user: req.user.id });
    if (!reward || reward.totalPoints < points)
      return res.status(400).json({ message: 'Itne points nahi hain aapke paas' });

    const cashback = Math.floor(points / POINTS_PER_RUPEE);
    reward.totalPoints -= points;
    reward.redeemHistory.push({ pointsUsed: points, cashbackValue: cashback });
    await reward.save();

    res.json({
      message: `🎉 ${points} points redeem ho gaye! ₹${cashback} cashback mil gaya!`,
      cashback,
      remainingPoints: reward.totalPoints,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
