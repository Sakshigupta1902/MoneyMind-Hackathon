const { GoogleGenerativeAI } = require('@google/generative-ai');
const Expense = require('../models/Expense');
const User = require('../models/User');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key_to_prevent_crash');

// Hardcoded Rules with Real Life Hinglish Examples
const PREDEFINED_RESPONSES = [
  {
    keywords: ['sip', 'mutual fund'],
    reply: "Bhai, SIP (Systematic Investment Plan) ka matlab hai har mahine ek choti aur fix amount Mutual Fund mein daalna. Jaise bachpan mein har roz gullak mein 10 rupaye daalte the, waise hi SIP mein auto-deduct hota hai. Market gire ya uthe, tumhara paisa average out hoke long term mein compounding ka jadoo dikhata hai!"
  },
  {
    keywords: ['fd', 'fixed deposit'],
    reply: "FD (Fixed Deposit) sabse safe jagah hai. Bank mein ek fix time ke liye paisa lock kar do aur guaranteed byaaj (interest) lo. Jaise tijori mein rakha paisa jo har saal thoda badh jata hai. Par yaad rakhna, iska return mehengai (inflation) ko zyada beat nahi kar pata."
  },
  {
    keywords: ['emergency', 'fund'],
    reply: "Emergency fund tumhari stepney (spare tyre) ki tarah hai. Gaadi puncture ho toh stepney kaam aati hai. Waise hi job chhutne ya medical emergency mein ye fund kaam aata hai. Kam se kam 3-6 mahine ka kharch liquid fund ya savings account mein alag se rakhna chahiye."
  },
  {
    keywords: ['save', 'saving', 'budget', 'manage'],
    reply: "Savings badhane ka ek simple rule hai: 50-30-20 rule. Apni salary ka 50% zaroori kharch (Roti, Kapda, Makaan) pe lagao. 30% apne shauk (Movie, Bahar khana) pe. Aur sabse pehle 20% seedha savings mein daal do! Salary aate hi 20% hata do, bache hue mein guzaara karo."
  },
  {
    keywords: ['credit card', 'credit', 'card'],
    reply: "Credit card ek do-dhari talwar hai. Agar time pe poora bill bharo, toh free ka paisa aur reward points hain (jaise discount mein movie ticket). Par agar 'Minimum Due' bhara, toh bank 40% tak ka byaaj lagati hai. Hamesha poora bill time pe clear karo!"
  },
  {
    keywords: ['hello', 'hi', 'namaste', 'hey'],
    reply: "Namaste! 🙏 Main aapka FinBot hoon. Main aapko Finance, SIP, FD, Credit Card aur Budgeting ke baare mein simple Hinglish mein samjha sakta hoon. Boliye, aaj kya seekhna hai?"
  }
];

exports.chat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    const user = await User.findById(req.user.id).select('-password');

    // Fetch current month expenses for context
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const expenses = await Expense.find({ user: req.user.id, date: { $gte: start } });
    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
    const byCategory = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});

    // Check predefined responses first
    const msgLower = message.toLowerCase();
    for (const item of PREDEFINED_RESPONSES) {
      if (item.keywords.some(kw => msgLower.includes(kw))) {
        return res.json({ reply: item.reply });
      }
    }

    const isEnglish = user.languagePreference === 'english';

    const systemContext = `You are FinBot, a friendly Indian financial advisor chatbot for ${user.name}.
User's monthly income: ₹${user.monthlyIncome}
This month's total expenses: ₹${totalSpent}
Savings so far: ₹${user.monthlyIncome - totalSpent}
Expense breakdown: ${JSON.stringify(byCategory)}

Guidelines:
- Explain financial terms simply (FD, SIP, compound interest, etc.)
${isEnglish 
  ? '- Respond entirely in clear, professional English.\n- Address the user respectfully.' 
  : "- Mix Hindi and English naturally (Hinglish).\n- Always use respectful words like 'Aap', 'Aapka', 'Aapne' instead of 'Tu' or 'Tum'."}
- Give personalized advice based on their actual spending data
- Be encouraging and practical
- Keep responses concise and actionable
- Use ₹ for Indian Rupees`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemContext }] },
        { role: 'model', parts: [{ text: isEnglish 
            ? `Hello ${user.name}! I am FinBot. I am ready to help you with your financial journey! 😊` 
            : `Namaste ${user.name}! Main aapka FinBot hoon. Aapki financial journey mein help karne ke liye ready hoon! 😊` }] },
        ...history.map((h) => ({ role: h.role, parts: [{ text: h.content }] })),
      ],
    });

    const result = await chat.sendMessage(message);
    const reply = result.response.text();

    res.json({ reply });
  } catch (err) {
    console.error('Chat error:', err);
    // Predefined Fallback if Gemini fails
    res.json({ reply: 'Bhai, lagta hai network mein thoda issue hai. Par tum mujhse direct FD, SIP, Emergency Fund, Credit Card ya Savings ke baare mein pooch sakte ho!' });
  }
};
