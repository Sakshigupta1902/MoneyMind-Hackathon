const { GoogleGenerativeAI } = require('@google/generative-ai');
const Expense = require('../models/Expense');
const User = require('../models/User');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Static allocation plans ──────────────────────────────────────────────────
const allocations = {
  short: {
    low:      [{ name: 'Fixed Deposit', pct: 70 }, { name: 'Liquid Mutual Fund', pct: 20 }, { name: 'Gold', pct: 10 }],
    moderate: [{ name: 'Fixed Deposit', pct: 50 }, { name: 'Debt Mutual Fund', pct: 30 }, { name: 'Gold', pct: 20 }],
    high:     [{ name: 'Fixed Deposit', pct: 30 }, { name: 'Equity Mutual Fund', pct: 50 }, { name: 'Gold', pct: 20 }],
  },
  long: {
    low:      [{ name: 'PPF', pct: 50 }, { name: 'Fixed Deposit', pct: 30 }, { name: 'Gold', pct: 20 }],
    moderate: [{ name: 'Equity Mutual Fund', pct: 50 }, { name: 'PPF', pct: 30 }, { name: 'Gold', pct: 20 }],
    high:     [{ name: 'Equity Mutual Fund', pct: 70 }, { name: 'Stocks', pct: 20 }, { name: 'Gold', pct: 10 }],
  },
};

// Instrument details — rates, risk, liquidity
const instrumentDetails = {
  'Fixed Deposit': {
    tip: 'Bank mein safe rakho, guaranteed return milta hai.',
    annualReturn: 7.0, risk: 'Low', liquidity: 'Medium',
    riskExplain: 'Market gire toh bhi FD safe rehta hai. Bank guarantee hoti hai ₹5 lakh tak.',
    color: '#3b82f6',
  },
  'Liquid Mutual Fund': {
    tip: 'Savings account se better, kabhi bhi nikaal sako.',
    annualReturn: 6.5, risk: 'Low', liquidity: 'High',
    riskExplain: 'Bahut kam risk hai. Short term debt mein invest karta hai.',
    color: '#06b6d4',
  },
  'Gold': {
    tip: 'Inflation se bachao. Portfolio ka 10-20% rakho.',
    annualReturn: 8.0, risk: 'Low-Medium', liquidity: 'High',
    riskExplain: 'Market crash mein gold usually upar jaata hai. Safe haven hai.',
    color: '#f59e0b',
  },
  'Debt Mutual Fund': {
    tip: 'FD se thoda zyada return, moderate risk.',
    annualReturn: 7.5, risk: 'Low-Medium', liquidity: 'High',
    riskExplain: 'Interest rate badhne se NAV thoda girta hai, lekin recover ho jaata hai.',
    color: '#8b5cf6',
  },
  'Equity Mutual Fund': {
    tip: 'Long term mein sabse zyada return. SIP se invest karo.',
    annualReturn: 12.0, risk: 'High', liquidity: 'High',
    riskExplain: 'Market crash mein 30-40% tak gir sakta hai. Lekin 5-7 saal mein recover hota hai.',
    color: '#10b981',
  },
  'PPF': {
    tip: 'Tax free, government backed. 15 saal lock-in.',
    annualReturn: 7.1, risk: 'None', liquidity: 'Low',
    riskExplain: 'Government guarantee hai. Koi risk nahi. Sirf lock-in ka dhyan rakho.',
    color: '#f97316',
  },
  'Stocks': {
    tip: 'High risk high reward. Research karke invest karo.',
    annualReturn: 15.0, risk: 'Very High', liquidity: 'High',
    riskExplain: 'Individual stocks 50-80% tak gir sakti hain. Diversify karo aur research karo.',
    color: '#ef4444',
  },
};

// ── Compound interest calculator ─────────────────────────────────────────────
const calcReturns = (principal, annualRate, years) => {
  const amount = principal * Math.pow(1 + annualRate / 100, years);
  return { finalAmount: Math.round(amount), profit: Math.round(amount - principal) };
};

// ── POST /api/investment/recommend ───────────────────────────────────────────
exports.getRecommendation = (req, res) => {
  try {
    const { amount, horizon, risk } = req.body;
    if (!amount || !horizon || !risk)
      return res.status(400).json({ message: 'amount, horizon, and risk are required' });

    const horizonKey = horizon.toLowerCase().includes('short') ? 'short' : 'long';
    const riskKey = risk.toLowerCase();
    const plan = allocations[horizonKey]?.[riskKey];
    if (!plan) return res.status(400).json({ message: 'Invalid horizon or risk value' });

    const years = horizonKey === 'short' ? 3 : 7;

    const result = plan.map((item) => {
      const details = instrumentDetails[item.name] || {};
      const investAmt = Math.round((item.pct / 100) * amount);
      const returns = calcReturns(investAmt, details.annualReturn || 7, years);
      return {
        ...item,
        investAmount: investAmt,
        tip: details.tip || '',
        annualReturn: details.annualReturn,
        risk: details.risk,
        liquidity: details.liquidity,
        riskExplain: details.riskExplain,
        color: details.color,
        projectedAmount: returns.finalAmount,
        projectedProfit: returns.profit,
      };
    });

    const totalProjected = result.reduce((s, i) => s + i.projectedAmount, 0);
    const totalProfit = result.reduce((s, i) => s + i.projectedProfit, 0);

    res.json({
      totalAmount: amount,
      horizon: horizonKey,
      risk: riskKey,
      years,
      allocation: result,
      totalProjected,
      totalProfit,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/investment/ai-advice ───────────────────────────────────────────
exports.getAIAdvice = async (req, res) => {
  try {
    const { amount, horizon, risk, allocation } = req.body;
    const user = await User.findById(req.user.id);

    // Get current month expenses for context
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const expenses = await Expense.find({ user: req.user.id, date: { $gte: start } });
    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
    const savings = user.monthlyIncome - totalSpent;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Tu ek expert Indian financial advisor hai jo simple Hinglish mein samjhata hai.

User Details:
- Naam: ${user.name}
- Monthly Income: ₹${user.monthlyIncome}
- Is mahine ka kharch: ₹${totalSpent}
- Is mahine ki savings: ₹${savings}
- Invest karna chahta hai: ₹${amount}
- Time horizon: ${horizon} term
- Risk appetite: ${risk}
- Recommended allocation: ${JSON.stringify(allocation?.map(a => `${a.name}: ${a.pct}%`))}

Ek detailed personalized advice do. Strict JSON format mein return karo:
{
  "personalizedSummary": "3-4 line Hinglish mein - user ke specific situation ke hisaab se advice. Unka naam use karo.",
  "whyThisPlan": "2-3 line mein explain karo kyun ye plan unke liye best hai",
  "howToStart": [
    "Step 1: Specific action Hinglish mein",
    "Step 2: Specific action Hinglish mein",
    "Step 3: Specific action Hinglish mein"
  ],
  "importantWarnings": [
    "Warning 1 Hinglish mein",
    "Warning 2 Hinglish mein"
  ],
  "alternativeTip": "Ek alternative suggestion agar ye plan suit na kare",
  "motivationalNote": "1 line encouraging message"
}

Sirf valid JSON return karo.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid AI response');

    res.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error('AI advice error (using fallback):', err.message);
    
    // Predefined Fallback Data if Gemini API fails
    const { risk, horizon, allocation } = req.body;
    const topAsset = allocation && allocation.length > 0 ? allocation[0].name : 'Mutual Funds';

    res.json({
      personalizedSummary: `Aapka risk appetite '${risk}' hai aur aap '${horizon}' term ke liye invest kar rahe hain. Is situation mein apne paise ko smartly divide karna sabse zaroori hai taaki risk aur return balance ho sake.`,
      whyThisPlan: `Ye plan isliye best hai kyunki isme '${topAsset}' ka bada hissa hai, jo aapko mehengai (inflation) ko beat karne mein madad karega bina unnecessarily aapki neend udaye.`,
      howToStart: [
        "Sabse pehle apna ek chhota sa Emergency Fund alag nikal lein.",
        "Kisi reliable platform (jaise Groww, Zerodha, ya apna Bank app) par account open karein.",
        "Invest amount ko ek baar mein lagane ke bajaye, har mahine SIP (Systematic Investment Plan) ke through lagana shuru karein."
      ],
      importantWarnings: [
        "Market girne par panic hoke (ghabrakar) paise bahar mat nikalna.",
        "Kabhi bhi udhaar (loan) lekar kisi risky asset mein invest mat karna."
      ],
      alternativeTip: "Agar aapko lagta hai ki ye plan thoda risky hai, toh aap 'Fixed Deposit' ya 'PPF' mein apna zyada paisa daal sakte hain jahan return 100% safe aur fix hota hai.",
      motivationalNote: "Paisa ped par nahi ugta, par sahi jagah invest karne par bilkul ped ki tarah badhta hai! 🌱"
    });
  }
};

// ── POST /api/investment/returns-calc ────────────────────────────────────────
exports.calculateReturns = (req, res) => {
  try {
    const { amount, years } = req.body;
    if (!amount || !years)
      return res.status(400).json({ message: 'amount aur years dono chahiye' });

    const instruments = [
      { name: 'Fixed Deposit',    rate: 7.0,  risk: 'Low',       color: '#3b82f6' },
      { name: 'PPF',              rate: 7.1,  risk: 'None',      color: '#f97316' },
      { name: 'Debt Mutual Fund', rate: 7.5,  risk: 'Low-Medium',color: '#8b5cf6' },
      { name: 'Gold',             rate: 8.0,  risk: 'Low-Medium',color: '#f59e0b' },
      { name: 'Equity Mutual Fund', rate: 12.0, risk: 'High',    color: '#10b981' },
      { name: 'Stocks',           rate: 15.0, risk: 'Very High', color: '#ef4444' },
    ];

    const results = instruments.map((inst) => {
      const { finalAmount, profit } = calcReturns(amount, inst.rate, years);
      return {
        ...inst,
        principal: amount,
        finalAmount,
        profit,
        growthPct: Math.round((profit / amount) * 100),
      };
    });

    // SIP calculation (monthly investment)
    const monthlyAmount = Math.round(amount / 12);
    const sipResults = [
      { name: 'SIP - Equity MF', rate: 12.0, color: '#10b981' },
      { name: 'SIP - Debt MF',   rate: 7.5,  color: '#8b5cf6' },
    ].map((inst) => {
      const months = years * 12;
      const r = inst.rate / 100 / 12;
      const sipFinal = Math.round(monthlyAmount * ((Math.pow(1 + r, months) - 1) / r) * (1 + r));
      const sipInvested = monthlyAmount * months;
      return {
        ...inst,
        monthlyAmount,
        totalInvested: sipInvested,
        finalAmount: sipFinal,
        profit: sipFinal - sipInvested,
        growthPct: Math.round(((sipFinal - sipInvested) / sipInvested) * 100),
      };
    });

    res.json({ amount, years, lumpsum: results, sip: sipResults });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/investment/compare ──────────────────────────────────────────────
exports.compareInstruments = (req, res) => {
  try {
    const comparison = [
      {
        name: 'Fixed Deposit', emoji: '🏦',
        returns: '6.5-7.5%', risk: 'Low', liquidity: 'Medium',
        minAmount: '₹1,000', taxable: 'Haan', lockIn: '7 days - 10 years',
        bestFor: 'Short term, safe investment',
        pros: ['Guaranteed returns', 'Bank insured ₹5L tak', 'Flexible tenure'],
        cons: ['Inflation se kam return', 'Premature withdrawal penalty', 'Tax lagta hai'],
        hinglishExplain: 'Bank mein paisa rakhte ho, fixed rate pe return milta hai. Bilkul safe hai.',
      },
      {
        name: 'SIP / Mutual Fund', emoji: '📈',
        returns: '10-15% (equity)', risk: 'Medium-High', liquidity: 'High',
        minAmount: '₹500/month', taxable: 'LTCG 10% above ₹1L', lockIn: 'None (ELSS: 3 yr)',
        bestFor: 'Long term wealth creation',
        pros: ['Rupee cost averaging', 'Professional management', 'Low minimum amount'],
        cons: ['Market risk hai', 'Returns guaranteed nahi', 'Patience chahiye'],
        hinglishExplain: 'Har mahine thoda thoda invest karo. Market upar neeche jaata hai lekin long term mein profit hota hai.',
      },
      {
        name: 'Gold', emoji: '🥇',
        returns: '7-10%', risk: 'Low-Medium', liquidity: 'High',
        minAmount: '₹1 (Digital Gold)', taxable: 'LTCG 20% with indexation', lockIn: 'None',
        bestFor: 'Inflation hedge, portfolio diversification',
        pros: ['Inflation se bachata hai', 'Crisis mein safe', 'Globally accepted'],
        cons: ['Storage cost (physical)', 'No regular income', 'Volatile short term'],
        hinglishExplain: 'Jab economy kharab hoti hai tab gold ka price badhta hai. Portfolio ka 10-20% gold mein rakho.',
      },
      {
        name: 'PPF', emoji: '🏛️',
        returns: '7.1% (tax-free)', risk: 'None', liquidity: 'Low',
        minAmount: '₹500/year', taxable: 'Bilkul nahi (EEE)', lockIn: '15 years',
        bestFor: 'Retirement, tax saving',
        pros: ['Tax free returns', 'Government guarantee', 'Section 80C benefit'],
        cons: ['15 saal lock-in', 'Partial withdrawal limited', 'Low liquidity'],
        hinglishExplain: 'Government ki scheme hai. Tax bilkul nahi lagta. Retirement ke liye best hai lekin 15 saal ke liye band ho jaata hai.',
      },
      {
        name: 'Stocks', emoji: '📊',
        returns: '12-20% (variable)', risk: 'Very High', liquidity: 'High',
        minAmount: '₹1 (fractional)', taxable: 'STCG 15%, LTCG 10%', lockIn: 'None',
        bestFor: 'High risk takers, long term',
        pros: ['Highest potential returns', 'Dividend income', 'Ownership in company'],
        cons: ['Research chahiye', 'Emotionally challenging', 'Can go to zero'],
        hinglishExplain: 'Company ka hissa kharidna. Agar company achhi karti hai toh paisa badhta hai. Research karo tabhi invest karo.',
      },
    ];

    res.json(comparison);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
