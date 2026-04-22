const Expense = require('../models/Expense');
const User = require('../models/User');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key_to_prevent_crash');

// ─── Manual Expense CRUD ───────────────────────────────────────────────────

exports.addExpense = async (req, res) => {
  try {
    const expense = await Expense.create({ ...req.body, user: req.user.id });

    // Check budget limits and create notification if needed
    const BudgetTarget = require('../models/BudgetTarget');
    const Notification = require('../models/Notification');
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const target = await BudgetTarget.findOne({ user: req.user.id, month, year, isActive: true });
    if (target) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      const expenses = await Expense.find({ user: req.user.id, date: { $gte: start, $lte: end } });
      const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
      const pct = (totalSpent / target.amount) * 100;
      const remaining = target.amount - totalSpent;

      const thresholds = [
        { pct: 100, key: 'budget_100', title: '🚨 Budget Exceed Ho Gaya!', msg: `Tumhara ₹${target.amount.toLocaleString()} ka budget exceed ho gaya! Total: ₹${totalSpent.toLocaleString()}`, type: 'danger' },
        { pct: 90, key: 'budget_90', title: '🚨 90% Budget Use Ho Gaya!', msg: `Danger! Sirf ₹${remaining.toLocaleString()} bacha hai. Abhi rok lo!`, type: 'danger' },
        { pct: 70, key: 'budget_70', title: '⚠️ 70% Budget Use Ho Gaya', msg: `Thoda control karo! ₹${remaining.toLocaleString()} bacha hai mahine mein.`, type: 'warning' },
      ];

      for (const t of thresholds) {
        if (pct >= t.pct) {
          const exists = await Notification.findOne({ user: req.user.id, 'meta.type': t.key, 'meta.month': month, 'meta.year': year });
          if (!exists) {
            await Notification.create({ user: req.user.id, title: t.title, message: t.msg, type: t.type, meta: { type: t.key, month, year, pct: Math.round(pct) } });
          }
          break;
        }
      }
    }

    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getExpenses = async (req, res) => {
  try {
    const { month, year } = req.query;
    const filter = { user: req.user.id };
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      filter.date = { $gte: start, $lte: end };
    }
    const expenses = await Expense.find(filter).sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const expenses = await Expense.find({ user: req.user.id, date: { $gte: start, $lte: end } });
    const user = await User.findById(req.user.id);

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const byCategory = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});

    // Generate smart budget suggestions only if monthly income is set
    let budgetSuggestions = [];
    if (user.monthlyIncome > 0) {
      const getCityTier = (city) => {
        if (!city) return 'tier2';
        const t1 = ['mumbai', 'bangalore', 'bengaluru', 'delhi', 'new delhi', 'chennai', 'hyderabad', 'kolkata', 'pune', 'gurgaon', 'noida'];
        const c = city.toLowerCase();
        if (t1.some(t => c.includes(t))) return 'tier1';
        return 'tier2';
      };
      const tier = getCityTier(user.city);

      budgetSuggestions = Object.entries(byCategory).map(([category, actual]) => {
        let suggested = 0;
        const catLower = category.toLowerCase();
        if (catLower.includes('rent') || catLower.includes('house')) {
          suggested = tier === 'tier1' ? Math.max(15000, user.monthlyIncome * 0.30) : Math.max(8000, user.monthlyIncome * 0.20);
        }
        else if (catLower.includes('food') || catLower.includes('dine')) {
          suggested = tier === 'tier1' ? Math.max(8000, user.monthlyIncome * 0.20) : Math.max(5000, user.monthlyIncome * 0.20);
        }
        else if (catLower.includes('transport') || catLower.includes('travel')) {
          suggested = tier === 'tier1' ? Math.max(3000, user.monthlyIncome * 0.10) : Math.max(2000, user.monthlyIncome * 0.10);
        }
        else if (catLower.includes('shop') || catLower.includes('enter')) suggested = user.monthlyIncome * 0.10;
        else suggested = user.monthlyIncome * 0.05; // Smaller bucket for other categories
        
        suggested = Math.min(suggested, user.monthlyIncome * 0.5); // Sanity cap over 50%
        
        return {
          category,
          suggested: Math.round(suggested),
          actual,
          status: actual > suggested ? 'over' : 'under'
        };
      });

      // Default suggestions if no expenses exist yet for a user with income
      if (budgetSuggestions.length === 0) {
        const rentSug = tier === 'tier1' ? Math.max(15000, user.monthlyIncome * 0.30) : Math.max(8000, user.monthlyIncome * 0.20);
        const foodSug = tier === 'tier1' ? Math.max(8000, user.monthlyIncome * 0.20) : Math.max(5000, user.monthlyIncome * 0.20);
        const transSug = tier === 'tier1' ? Math.max(3000, user.monthlyIncome * 0.10) : Math.max(2000, user.monthlyIncome * 0.10);
        
        budgetSuggestions.push(
          { category: "Rent", suggested: Math.round(rentSug), actual: 0, status: 'under' },
          { category: "Food", suggested: Math.round(foodSug), actual: 0, status: 'under' },
          { category: "Transport", suggested: Math.round(transSug), actual: 0, status: 'under' }
        );
      }
    }

    res.json({
      monthlyIncome: user.monthlyIncome,
      totalExpenses,
      savings: user.monthlyIncome - totalExpenses,
      surplus: user.monthlyIncome - totalExpenses,
      byCategory,
      budgetSuggestions
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── AI: Next Month Prediction (based on manual expense history) ──────────

exports.getAIPrediction = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // Last 3 months expenses
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const expenses = await Expense.find({
      user: req.user.id,
      date: { $gte: threeMonthsAgo },
    }).sort({ date: 1 });

    if (expenses.length === 0)
      return res.status(400).json({ message: 'Prediction ke liye kam se kam kuch expenses add karo pehle!' });

    // Group by month
    const byMonth = {};
    expenses.forEach((e) => {
      const key = `${e.date.getFullYear()}-${e.date.getMonth() + 1}`;
      if (!byMonth[key]) byMonth[key] = { total: 0, items: [] };
      byMonth[key].total += e.amount;
      byMonth[key].items.push({ amount: e.amount, category: e.category, description: e.description });
    });

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Tu ek smart Indian financial AI hai.

User ka naam: ${user.name}
Monthly Income: ₹${user.monthlyIncome}
City/Location: ${user.city || 'India'} (Is city ke cost of living ke hisaab se prediction karo)

Pichle mahino ka expense data:
${JSON.stringify(byMonth, null, 2)}

Is data ke basis pe next month ka prediction karo. Strict JSON format mein return karo:
{
  "predictedTotal": <number - next month predicted total expense>,
  "predictedSavings": <number - income minus predicted total>,
  "categoryWise": [
    { "category": "category name", "predictedAmount": <number>, "trend": "increasing/stable/decreasing", "reason": "1 line Hinglish mein reason (jaise mehengai/inflation, festive season, ya past pattern ke hisaab se)" }
  ],
  "topInsight": "2-3 line Hinglish mein main insight - friendly tone mein",
  "savingTip": "1 actionable tip Hinglish mein jo next month savings badha sake",
  "warningCategories": ["categories jahan overspending ka risk hai"]
}

Sirf valid JSON return karo, koi extra text nahi.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid AI response');

    const prediction = JSON.parse(jsonMatch[0]);
    res.json(prediction);
  } catch (err) {
    console.error('Prediction error (using fallback):', err.message);
    try {
      // Predefined Fallback Data if Gemini API fails
      // Calculate average from user's history instead of a hardcoded value
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const fallbackExpenses = await Expense.find({ user: req.user.id, date: { $gte: threeMonthsAgo } });

      let predictedTotal = 15000;
      let categoryWise = [
        { category: "Food & Dining", predictedAmount: 4500, trend: "stable", reason: "Khane ka kharch lagbhag same rehta hai." },
        { category: "Shopping", predictedAmount: 1500, trend: "decreasing", reason: "Pichle mahine shopping hui thi, is baar kam hogi." },
        { category: "Transport", predictedAmount: 2250, trend: "increasing", reason: "Travel aur petrol ka kharch thoda badh sakta hai." }
      ];

      if (fallbackExpenses.length > 0) {
        const uniqueMonths = new Set();
        const byCategory = {};
        fallbackExpenses.forEach((e) => {
          const monthKey = `${e.date.getFullYear()}-${e.date.getMonth() + 1}`;
          uniqueMonths.add(monthKey);
          if (!byCategory[e.category]) byCategory[e.category] = 0;
          byCategory[e.category] += e.amount;
        });
        
        const monthsCount = Math.max(1, uniqueMonths.size);
        predictedTotal = 0;
        categoryWise = [];
        
        for (const [cat, totalAmt] of Object.entries(byCategory)) {
          const avgAmt = Math.round(totalAmt / monthsCount);
          
          let trend = "stable";
          let reason = `${cat} ka pichle mahino ke average ke hisaab se calculation.`;
          let predictedAmount = avgAmt;
          const catLower = cat.toLowerCase();

          if (catLower.includes('food') || catLower.includes('dine') || catLower.includes('grocer')) {
            trend = "increasing";
            reason = "Mehengai (inflation) ki wajah se khane peene ka kharch thoda badh sakta hai.";
            predictedAmount = Math.round(avgAmt * 1.05); // 5% increase for inflation
          } else if (catLower.includes('transport') || catLower.includes('travel') || catLower.includes('petrol')) {
            trend = "increasing";
            reason = "Travel aur fuel costs fluctuate hote hain, isliye thoda badh sakta hai.";
            predictedAmount = Math.round(avgAmt * 1.05); // 5% increase
          } else if (catLower.includes('shop') || catLower.includes('enter') || catLower.includes('movie')) {
            trend = "decreasing";
            reason = "Is category mein unnecessary kharch control kiya ja sakta hai.";
            predictedAmount = Math.round(avgAmt * 0.90); // 10% decrease
          }

          predictedTotal += predictedAmount;
          categoryWise.push({
            category: cat,
            predictedAmount: predictedAmount,
            trend: trend,
            reason: reason
          });
        }
        // Highest amount wali categories upar dikhane ke liye sort karein
        categoryWise.sort((a, b) => b.predictedAmount - a.predictedAmount);
      }
      const user = await User.findById(req.user.id);
      const topCategories = categoryWise.slice(0, 2).map(c => c.category);

      res.json({
        predictedTotal,
        predictedSavings: user.monthlyIncome > predictedTotal ? user.monthlyIncome - predictedTotal : 0,
        categoryWise,
        topInsight: "Aapka kharch thoda aur control ho sakta hai. Bahar khana thoda kam karein.",
        savingTip: "Weekend pe bahar jaane ke bajaye doston ko ghar par invite karein, paise bachenge!",
        warningCategories: topCategories.length > 0 ? topCategories : ["Shopping", "Entertainment"]
      });
    } catch (fallbackErr) {
      res.status(500).json({ message: 'Prediction generate nahi ho paya. Thodi der baad try karein.' });
    }
  }
};

// ─── AI Financial Planner (salary + expense form → AI chart + advice) ─────

exports.getAIFinancialPlan = async (req, res) => {
  try {
    const { salary, expenses, city } = req.body;
    // expenses = { rent, food, transport, entertainment, health, shopping, education, other }

    if (!salary || !expenses)
      return res.status(400).json({ message: 'Salary aur expenses dono chahiye' });

    const totalExpenses = Object.values(expenses).reduce((s, v) => s + (Number(v) || 0), 0);
    const savings = salary - totalExpenses;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Tu ek friendly Indian financial planner AI hai jo simple Hinglish mein baat karta hai.

User ki details:
City: ${city || 'India'} (Consider cost of living and average rent of this city)
Monthly Salary: ₹${salary}
Monthly Expenses:
- Rent/Housing: ₹${expenses.rent || 0}
- Food & Groceries: ₹${expenses.food || 0}
- Transport: ₹${expenses.transport || 0}
- Entertainment: ₹${expenses.entertainment || 0}
- Health: ₹${expenses.health || 0}
- Shopping: ₹${expenses.shopping || 0}
- Education: ₹${expenses.education || 0}
- Other: ₹${expenses.other || 0}
Total Expenses: ₹${totalExpenses}
Net Savings: ₹${savings}

Ek detailed financial plan banao. Strict JSON format mein return karo:
{
  "totalExpenses": ${totalExpenses},
  "totalSavings": ${savings},
  "savingsPercentage": <number - savings/salary * 100, 1 decimal>,
  "healthScore": <number 1-10 - financial health score>,
  "healthLabel": "Poor/Average/Good/Excellent",
  "chartData": [
    { "name": "category name", "amount": <number>, "percentage": <number - % of salary> }
  ],
  "monthlyBreakdown": {
    "mustSpend": <number - rent+food+transport+health>,
    "wantSpend": <number - entertainment+shopping>,
    "savings": <number>
  },
  "suggestions": [
    { "category": "category name", "currentAmount": <number>, "suggestedAmount": <number>, "saving": <number>, "tip": "Hinglish mein practical tip" }
  ],
  "topAdvice": "3-4 line Hinglish mein overall financial advice - dost ki tarah",
  "yearlyProjection": {
    "currentSavings": <number - savings * 12>,
    "ifFollowAdvice": <number - projected savings if suggestions followed>,
    "fdReturns": <number - yearly savings in FD at 7%>
  },
  "emergencyFundStatus": "Hinglish mein - kitne months ka emergency fund ban sakta hai"
}

Sirf valid JSON return karo.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid AI response');

    const plan = JSON.parse(jsonMatch[0]);
    res.json(plan);
  } catch (err) {
    console.error('Planner error (using fallback):', err.message);
    // Predefined / Calculated Fallback Plan if Gemini API fails
    const { salary, expenses } = req.body;
    const totalExpenses = Object.values(expenses).reduce((s, v) => s + (Number(v) || 0), 0);
    const savings = salary - totalExpenses;
    const savingsPct = salary > 0 ? (savings / salary) * 100 : 0;

    let healthScore = 5; let healthLabel = "Average";
    if (savingsPct >= 30) { healthScore = 9; healthLabel = "Excellent"; }
    else if (savingsPct >= 20) { healthScore = 7; healthLabel = "Good"; }
    else if (savingsPct < 10) { healthScore = 3; healthLabel = "Poor"; }

    // Dynamically calculate savings based on actual inputs
    const entAmt = Number(expenses.entertainment) || 0;
    const shopAmt = Number(expenses.shopping) || 0;
    const entSuggested = Math.max(0, entAmt - 500);
    const shopSuggested = Math.max(0, shopAmt - 1000);
    const entSaving = entAmt - entSuggested;
    const shopSaving = shopAmt - shopSuggested;
    const totalExtraSaving = entSaving + shopSaving;

    res.json({
      totalExpenses,
      totalSavings: savings,
      savingsPercentage: Math.round(savingsPct * 10) / 10,
      healthScore,
      healthLabel,
      chartData: Object.entries(expenses).filter(([_, v]) => v > 0).map(([k, v]) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), amount: v, percentage: Math.round((v / salary) * 100) })),
      monthlyBreakdown: {
        mustSpend: (expenses.rent || 0) + (expenses.food || 0) + (expenses.transport || 0) + (expenses.health || 0),
        wantSpend: (expenses.entertainment || 0) + (expenses.shopping || 0) + (expenses.other || 0),
        savings: savings
      },
      suggestions: [
        { category: "Entertainment", currentAmount: entAmt, suggestedAmount: entSuggested, saving: entSaving, tip: "Movie tickets ki jagah OTT subscriptions ka use karo." },
        { category: "Shopping", currentAmount: shopAmt, suggestedAmount: shopSuggested, saving: shopSaving, tip: "Impulse buying se bacho, 24-hour rule follow karo." }
      ],
      topAdvice: savingsPct > 20 ? "Bahut badhiya! Tumhari savings track par hai. Is paise ko SIP mein lagana shuru karo." : "Thoda kharch control karna padega bhai! Unnecessary kharch kam karo.",
      yearlyProjection: {
        currentSavings: savings * 12,
        ifFollowAdvice: (savings + totalExtraSaving) * 12,
        fdReturns: Math.round((savings * 12) * 1.07)
      },
      emergencyFundStatus: `Current savings se tum ${Math.round((savings * 12) / (totalExpenses || 1))} mahine ka emergency fund bana sakte ho 1 saal mein.`
    });
  }
};
