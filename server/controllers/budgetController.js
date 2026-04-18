const BudgetTarget = require('../models/BudgetTarget');
const Expense = require('../models/Expense');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper: get current month start/end
const getMonthRange = (month, year) => ({
  start: new Date(year, month - 1, 1),
  end: new Date(year, month, 0, 23, 59, 59),
});

// Helper: calculate spent amount for current period based on type
const getSpentForPeriod = (expenses, type, targetAmount) => {
  const now = new Date();

  if (type === 'monthly') {
    return expenses.reduce((s, e) => s + e.amount, 0);
  }

  if (type === 'weekly') {
    // Current week (Mon-Sun)
    const day = now.getDay() || 7;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - day + 1);
    weekStart.setHours(0, 0, 0, 0);
    return expenses
      .filter((e) => new Date(e.date) >= weekStart)
      .reduce((s, e) => s + e.amount, 0);
  }

  if (type === 'daily') {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return expenses
      .filter((e) => new Date(e.date) >= todayStart)
      .reduce((s, e) => s + e.amount, 0);
  }

  return 0;
};

// Helper: get period limit from monthly target
const getPeriodLimit = (monthlyAmount, type) => {
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  if (type === 'daily') return Math.round(monthlyAmount / daysInMonth);
  if (type === 'weekly') return Math.round(monthlyAmount / 4);
  return monthlyAmount;
};

// POST /api/budget/target
exports.setTarget = async (req, res) => {
  try {
    const { amount, type } = req.body;
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const target = await BudgetTarget.findOneAndUpdate(
      { user: req.user.id, month, year },
      { amount, type, isActive: true },
      { upsert: true, new: true }
    );

    // Create a success notification
    await Notification.create({
      user: req.user.id,
      title: 'Budget Target Set! 🎯',
      message: `Tumhara ${type} budget target ₹${amount.toLocaleString()} set ho gaya. Ab hum tumhe alert karenge!`,
      type: 'success',
    });

    res.json(target);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/budget/status
exports.getStatus = async (req, res) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const target = await BudgetTarget.findOne({ user: req.user.id, month, year, isActive: true });
    if (!target) return res.json({ hasTarget: false });

    const { start, end } = getMonthRange(month, year);
    const expenses = await Expense.find({ user: req.user.id, date: { $gte: start, $lte: end } });

    const monthlySpent = expenses.reduce((s, e) => s + e.amount, 0);
    const periodLimit = getPeriodLimit(target.amount, target.type);
    const periodSpent = getSpentForPeriod(expenses, target.type, target.amount);

    const monthlyPct = Math.round((monthlySpent / target.amount) * 100);
    const periodPct = Math.round((periodSpent / periodLimit) * 100);
    const remaining = target.amount - monthlySpent;

    // Days left in month
    const daysInMonth = new Date(year, month, 0).getDate();
    const daysLeft = daysInMonth - now.getDate();
    const dailyAllowance = daysLeft > 0 ? Math.round(remaining / daysLeft) : 0;

    res.json({
      hasTarget: true,
      target,
      monthlySpent,
      periodSpent,
      periodLimit,
      monthlyPct,
      periodPct,
      remaining,
      daysLeft,
      dailyAllowance,
      isExceeded: monthlySpent > target.amount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/budget/check-notify  (called after every expense add)
exports.checkAndNotify = async (req, res) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const target = await BudgetTarget.findOne({ user: req.user.id, month, year, isActive: true });
    if (!target) return res.json({ notified: false });

    const { start, end } = getMonthRange(month, year);
    const expenses = await Expense.find({ user: req.user.id, date: { $gte: start, $lte: end } });
    const monthlySpent = expenses.reduce((s, e) => s + e.amount, 0);
    const pct = (monthlySpent / target.amount) * 100;
    const remaining = target.amount - monthlySpent;

    let notification = null;

    if (pct >= 100) {
      // Check if 100% notification already sent today
      const existing = await Notification.findOne({
        user: req.user.id,
        'meta.type': 'budget_100',
        'meta.month': month,
        'meta.year': year,
      });
      if (!existing) {
        notification = await Notification.create({
          user: req.user.id,
          title: '🚨 Budget Exceed Ho Gaya!',
          message: `Tumhara ₹${target.amount.toLocaleString()} ka budget exceed ho gaya! Total kharch: ₹${monthlySpent.toLocaleString()}. Ab koi bhi naya expense mat karo!`,
          type: 'danger',
          meta: { type: 'budget_100', month, year, pct: Math.round(pct) },
        });
      }
    } else if (pct >= 90) {
      const existing = await Notification.findOne({
        user: req.user.id,
        'meta.type': 'budget_90',
        'meta.month': month,
        'meta.year': year,
      });
      if (!existing) {
        notification = await Notification.create({
          user: req.user.id,
          title: '🚨 90% Budget Use Ho Gaya!',
          message: `Danger! Tumne ₹${monthlySpent.toLocaleString()} kharch kar diya. Sirf ₹${remaining.toLocaleString()} bacha hai. Abhi rok lo!`,
          type: 'danger',
          meta: { type: 'budget_90', month, year, pct: Math.round(pct) },
        });
      }
    } else if (pct >= 70) {
      const existing = await Notification.findOne({
        user: req.user.id,
        'meta.type': 'budget_70',
        'meta.month': month,
        'meta.year': year,
      });
      if (!existing) {
        notification = await Notification.create({
          user: req.user.id,
          title: '⚠️ 70% Budget Use Ho Gaya',
          message: `Thoda control karo! ₹${monthlySpent.toLocaleString()} kharch ho gaya. ₹${remaining.toLocaleString()} bacha hai mahine mein.`,
          type: 'warning',
          meta: { type: 'budget_70', month, year, pct: Math.round(pct) },
        });
      }
    }

    res.json({ notified: !!notification, pct: Math.round(pct), notification });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/budget/month-summary  (month end AI summary)
exports.getMonthSummary = async (req, res) => {
  try {
    const now = new Date();
    // Allow checking current or previous month
    const month = parseInt(req.query.month) || now.getMonth() + 1;
    const year = parseInt(req.query.year) || now.getFullYear();

    const { start, end } = getMonthRange(month, year);
    const expenses = await Expense.find({ user: req.user.id, date: { $gte: start, $lte: end } });
    const user = await User.findById(req.user.id);
    const target = await BudgetTarget.findOne({ user: req.user.id, month, year });

    if (expenses.length === 0)
      return res.status(400).json({ message: 'Is mahine koi expense nahi hai summary ke liye' });

    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
    const byCategory = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Tu ek caring Indian financial advisor hai jo simple Hinglish mein baat karta hai.

User: ${user.name}
Monthly Income: ₹${user.monthlyIncome}
Month: ${month}/${year}
Budget Target: ${target ? `₹${target.amount}` : 'Set nahi kiya tha'}
Total Spent: ₹${totalSpent}
Savings: ₹${user.monthlyIncome - totalSpent}
Category wise spending: ${JSON.stringify(byCategory)}

Is mahine ka complete summary aur action plan banao. Strict JSON return karo:
{
  "overallStatus": "Great/Good/Average/Poor",
  "statusEmoji": "emoji",
  "summary": "3-4 line Hinglish mein is mahine ka overall summary - dost ki tarah baat karo",
  "topSpendingCategory": "sabse zyada kharch wali category",
  "biggestWin": "is mahine kya achha hua (agar kuch achha hua)",
  "biggestConcern": "sabse badi chinta kya hai",
  "actionPlan": [
    { "step": 1, "action": "Specific action Hinglish mein", "impact": "Isse kitna bachega monthly" },
    { "step": 2, "action": "Specific action Hinglish mein", "impact": "Isse kitna bachega monthly" },
    { "step": 3, "action": "Specific action Hinglish mein", "impact": "Isse kitna bachega monthly" }
  ],
  "nextMonthGoal": "Next month ke liye ek specific goal Hinglish mein",
  "motivationalMessage": "1-2 line encouraging message Hinglish mein"
}

Sirf valid JSON return karo.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid AI response');

    const aiSummary = JSON.parse(jsonMatch[0]);

    // Pie chart data
    const chartData = Object.entries(byCategory).map(([name, value]) => ({
      name,
      value,
      percentage: Math.round((value / totalSpent) * 100),
    }));

    res.json({
      month, year,
      totalSpent,
      totalIncome: user.monthlyIncome,
      savings: user.monthlyIncome - totalSpent,
      target: target?.amount || null,
      targetAchieved: target ? totalSpent <= target.amount : null,
      chartData,
      aiSummary,
    });
  } catch (err) {
    console.error('Month summary error (using fallback):', err.message);
    try {
      // Predefined Fallback Data Generation if Gemini API fails
      const month = parseInt(req.query.month) || new Date().getMonth() + 1;
      const year = parseInt(req.query.year) || new Date().getFullYear();
      const { start, end } = getMonthRange(month, year);
      const expenses = await Expense.find({ user: req.user.id, date: { $gte: start, $lte: end } });
      const user = await User.findById(req.user.id);
      const target = await BudgetTarget.findOne({ user: req.user.id, month, year });
      const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
      const byCategory = expenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc; }, {});
      
      let topCategory = "None"; let maxSpent = 0;
      const chartData = Object.entries(byCategory).map(([name, value]) => {
        if (value > maxSpent) { maxSpent = value; topCategory = name; }
        return { name, value, percentage: Math.round((value / totalSpent) * 100) || 0 };
      });

      const isUnderBudget = target ? totalSpent <= target.amount : true;
      const savings = user.monthlyIncome - totalSpent;
      let overallStatus = savings > user.monthlyIncome * 0.2 && isUnderBudget ? "Great" : (savings > 0 && isUnderBudget ? "Good" : (savings < 0 ? "Poor" : "Average"));
      let statusEmoji = overallStatus === "Great" ? "🌟" : (overallStatus === "Good" ? "👍" : (overallStatus === "Poor" ? "🚨" : "😐"));

      res.json({
        month, year, totalSpent, totalIncome: user.monthlyIncome, savings,
        target: target?.amount || null,
        targetAchieved: target ? totalSpent <= target.amount : null,
        chartData,
        aiSummary: {
          overallStatus, statusEmoji,
          summary: isUnderBudget ? "Bahut badhiya! Is mahine tumne budget ke andar kharch kiya hai. Aise hi control rakho." : "Is mahine kharch thoda zyada ho gaya hai. Agle mahine thoda budget par dhyan dena padega.",
          topSpendingCategory: topCategory,
          biggestWin: savings > 0 ? `₹${savings} ki savings hui hai!` : "Kharch track karna shuru kiya, ye achhi aadat hai.",
          biggestConcern: !isUnderBudget ? "Budget limit cross ho gayi." : (maxSpent > ((user.monthlyIncome || 1) * 0.3) ? `${topCategory} mein kharch zyada hai.` : "Koi khaas chinta nahi."),
          actionPlan: [
            { step: 1, action: `${topCategory} ka kharch thoda kam karne ka try karo`, impact: `₹${Math.round(maxSpent * 0.1)} bachenge` },
            { step: 2, action: "Bahar khana ya unnecessary shopping control karo", impact: "₹500 - ₹1000 bachenge" },
            { step: 3, action: "Jo paise bache hain unhe FD ya SIP mein daalo", impact: "Long term wealth banegi" }
          ],
          nextMonthGoal: "Agle mahine is mahine se kam kharch karna hai aur savings badhani hai.",
          motivationalMessage: "Paise bachana ek aadat hai. Tum sahi track par ho, bas lage raho! 💪"
        }
      });
    } catch (fallbackErr) {
      res.status(500).json({ message: 'Summary generate nahi hua. Try again!' });
    }
  }
};
