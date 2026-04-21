const { GoogleGenerativeAI } = require('@google/generative-ai');
const DailyLesson = require('../models/DailyLesson');
const LessonProgress = require('../models/LessonProgress');
const UserReward = require('../models/UserReward');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key_to_prevent_crash');

// Rotating topics list
const TOPICS = [
  'Fixed Deposit (FD)', 'Savings Account', 'Recurring Deposit (RD)', 'PPF (Public Provident Fund)',
  'Mutual Funds', 'SIP (Systematic Investment Plan)', 'Index Funds', 'ELSS Tax Saving Funds',
  'Term Life Insurance', 'Health Insurance', 'ULIPs', 'Endowment Plans',
  'Stock Market Basics', 'How to Read a Stock', 'Sensex aur Nifty kya hai', 'Dividend kya hota hai',
  'Gold Investment', 'Real Estate vs Mutual Fund', 'Sovereign Gold Bond', 'Digital Gold',
  'Income Tax Basics', 'Section 80C Tax Saving', 'TDS kya hota hai', 'ITR kaise bharte hain',
  'Credit Score kya hota hai', 'EMI kaise calculate hoti hai', 'Good Debt vs Bad Debt', 'Credit Card Smart Use',
  'Emergency Fund kya hai', 'Compound Interest ka jaadu', 'Inflation kya hoti hai', 'Rupee Cost Averaging',
];

const getTodayDate = () => new Date().toISOString().split('T')[0];

const getTopicForDate = (date) => {
  const dayIndex = Math.floor(new Date(date).getTime() / 86400000);
  return TOPICS[dayIndex % TOPICS.length];
};

// Hardcoded Lessons with Real Life Hinglish Examples
const HARDCODED_LESSONS = [
  {
    topic: "Emergency Fund",
    paragraph: "Socho ek din achanak tumhari gaadi kharab ho jaye ya ghar mein kisi ki tabiyat kharab ho jaye aur turant paise chahiye hon. Aise time pe agar savings na ho, toh doston ya rishtedaron se udhaar maangna padta hai. Isiliye 'Emergency Fund' banana bahut zaroori hai. Ye fund tumhari 3 se 6 mahine ki salary ya kharch ke barabar hona chahiye. Is paise ko bank ke savings account ya liquid mutual fund mein rakho taaki zaroorat padne par turant nikal sako. Jaise gaadi mein stepney (spare tyre) hoti hai, waise hi life mein emergency fund kaam aata hai.",
    mcq: {
      question: "Emergency Fund kitne mahine ke kharch ke barabar hona chahiye?",
      options: ["1 mahine ka", "3 se 6 mahine ka", "10 saal ka", "15 din ka"],
      correctIndex: 1,
      explanation: "Emergency fund hamesha 3 se 6 mahine ke expenses ke barabar hona chahiye, taaki job chhutne ya medical emergency mein dikkat na ho."
    }
  },
  {
    topic: "Fixed Deposit (FD)",
    paragraph: "Hamare gharon mein mummy-papa hamesha kehte hain ki paise 'FD' (Fixed Deposit) mein daal do. FD ka matlab hai bank mein ek fix time ke liye paise jama karna, jis par bank ek fixed interest (byaaj) deta hai. Jaise agar tumne ₹10,000 ek saal ke liye 7% interest par FD mein daale, toh 1 saal baad guarantee ke sath ₹10,700 milenge. Stock market chahe upar jaye ya neeche, FD ka paisa hamesha safe rehta hai. Ye un logon ke liye best hai jo apne paise par bilkul bhi risk nahi lena chahte.",
    mcq: {
      question: "FD (Fixed Deposit) mein invest karne ka sabse bada fayda kya hai?",
      options: ["Paisa double ho jata hai 1 mahine mein", "Stock market ka risk hota hai", "Guaranteed aur safe return milta hai", "Paisa bank mein lock nahi hota"],
      correctIndex: 2,
      explanation: "FD mein invest karne par bank guaranteed return deta hai aur market girne par bhi paisa 100% safe rehta hai."
    }
  },
  {
    topic: "Inflation (Mehengai)",
    paragraph: "Bachpan mein jo samosa ₹5 ka milta tha, aaj wahi samosa ₹15 ya ₹20 ka ho gaya hai. Samosa wahi hai, bas uski keemat badh gayi hai. Ise hi 'Inflation' ya Mehengai kehte hain. Har saal hamare paise ki purchasing power (value) kam hoti rehti hai. Agar tum ₹500 aaj tijori mein lock kar do, toh 5 saal baad us ₹500 mein utna saaman nahi aayega jitna aaj aa sakta hai. Isiliye paise ko sirf ghar mein rakhna bewakoofi hai, use aisi jagah invest karna chahiye jahan return mehengai (inflation) se zyada mile.",
    mcq: {
      question: "Inflation (Mehengai) ka hamare paise par kya asar hota hai?",
      options: ["Paise ki value badh jati hai", "Paise ki value kam ho jati hai", "Koi asar nahi hota", "Paise double ho jate hain"],
      correctIndex: 1,
      explanation: "Inflation ki wajah se chizon ke daam badh jate hain, jisse hamare paise ki value kam ho jati hai."
    }
  },
  {
    topic: "SIP (Systematic Investment Plan)",
    paragraph: "SIP ka matlab hai har mahine thoda-thoda paisa Mutual Funds mein invest karna. Jaise bachpan mein hum apni 'Gullak' mein har roz 10-10 rupaye daalte the, SIP bhi waise hi ek smart gullak hai. Tum har mahine apni salary se ₹1,000 ya ₹500 ek fixed date par auto-invest kar sakte ho. Iska fayda ye hai ki tumhe market kab upar jayega ya neeche, iski tension nahi leni padti. Jab market girta hai toh tumhe saste mein zyada units mil jate hain, jise Rupee Cost Averaging kehte hain.",
    mcq: {
      question: "SIP (Systematic Investment Plan) ka main concept kya hai?",
      options: ["Ek hi baar mein saara paisa lagana", "Har mahine thoda-thoda paisa invest karna", "Bank se udhaar lena", "Sirf gold kharidna"],
      correctIndex: 1,
      explanation: "SIP mein hum ek fixed amount har mahine ya regular interval par invest karte hain, jo future mein ek bada corpus banata hai."
    }
  },
  {
    topic: "Power of Compounding",
    paragraph: "Albert Einstein ne Compounding ko duniya ka 8wa ajooba (8th wonder) kaha tha. Compounding ka matlab hai 'byaaj par byaaj' (interest on interest) milna. Maan lo tumne ₹100 invest kiye 10% interest par. Ek saal baad wo ₹110 ho gaye. Agle saal tumhe ₹100 par nahi, balki ₹110 par 10% interest milega! Shuru ke 3-4 saal mein ye bahut chhota lagta hai, par 10-15 saal mein ye ekdum magic ki tarah kaam karta hai aur thoda sa paisa bhi lakhon mein badal jata hai.",
    mcq: {
      question: "Compounding ko simple bhasha mein kya kehte hain?",
      options: ["Bank ki fee", "Sirf principal par byaaj", "Byaaj par byaaj (Interest on interest)", "Mutual fund ka tax"],
      correctIndex: 2,
      explanation: "Compounding mein tumhare lagaye gaye paise ke saath-sath jo return milta hai, aage chal kar us return par bhi interest milta hai."
    }
  }
];

// Generate lesson from Gemini
const generateLesson = async (topic) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `Tu ek friendly Indian financial teacher hai jo simple Hinglish mein padhata hai.

Topic: "${topic}"

Ek lesson likho is format mein (STRICT JSON format mein return karo, koi extra text nahi):
{
  "topic": "${topic}",
  "paragraph": "150-200 words ka paragraph. Simple Hinglish mein likho. Real life Indian examples use karo (chai, ghar, rickshaw, salary, etc.). Koi bhi financial term use karo toh turant simple words mein explain karo. Aise likho jaise ek dost dusre dost ko samjha raha ho. Bullet points mat use karo, flowing paragraph likho.",
  "mcq": {
    "question": "Paragraph ke content pe based ek simple question",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "1-2 lines mein explain karo kyun ye answer sahi hai, simple Hinglish mein"
  }
}

Important:
- Paragraph bilkul simple hona chahiye, 8th class ka student bhi samjhe
- MCQ ka sahi answer paragraph mein clearly mentioned hona chahiye
- correctIndex 0 se 3 ke beech hona chahiye
- Sirf valid JSON return karo`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Extract JSON — handle markdown code blocks too
  const cleaned = text.replace(/```json|```/g, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid Gemini response: ' + text.slice(0, 200));

  let parsed;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    // Try to fix common JSON issues
    const fixed = jsonMatch[0].replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
    parsed = JSON.parse(fixed);
  }
  return parsed;
};

// GET /api/lesson/today
exports.getTodayLesson = async (req, res) => {
  try {
    const today = getTodayDate();
    let lesson = await DailyLesson.findOne({ date: today });

    // Generate if not cached
    if (!lesson) {
      let generated;
      if (HARDCODED_LESSONS && HARDCODED_LESSONS.length > 0) {
        const dayIndex = Math.floor(new Date(today).getTime() / 86400000);
        generated = HARDCODED_LESSONS[dayIndex % HARDCODED_LESSONS.length];
      } else {
        const topic = getTopicForDate(today);
        generated = await generateLesson(topic);
      }
      lesson = await DailyLesson.create({ date: today, ...generated });
    }

    // Check user's progress for today
    const progress = await LessonProgress.findOne({ user: req.user.id, date: today });

    // Return lesson but hide correctIndex if not answered yet
    const lessonData = lesson.toObject();
    if (!progress?.answered) {
      delete lessonData.mcq.correctIndex;
      delete lessonData.mcq.explanation;
    }

    res.json({ lesson: lessonData, progress: progress || null });
  } catch (err) {
    console.error('Lesson error:', err.message);
    res.status(500).json({ message: `Lesson generate karne mein error aaya: ${err.message}` });
  }
};

// POST /api/lesson/answer
exports.submitAnswer = async (req, res) => {
  try {
    const today = getTodayDate();
    const { selectedIndex } = req.body;

    // Check already answered
    const existing = await LessonProgress.findOne({ user: req.user.id, date: today });
    if (existing?.answered) return res.status(400).json({ message: 'Aaj ka jawab already de diya hai!' });

    const lesson = await DailyLesson.findOne({ date: today });
    if (!lesson) return res.status(404).json({ message: 'Aaj ka lesson nahi mila' });

    const isCorrect = selectedIndex === lesson.mcq.correctIndex;
    let pointsEarned = 2; // base points for attempting
    if (isCorrect) pointsEarned += 5; // bonus for correct answer

    // Save progress
    await LessonProgress.create({
      user: req.user.id,
      date: today,
      answered: true,
      correct: isCorrect,
      selectedIndex,
      pointsEarned,
    });

    // Update reward wallet
    let reward = await UserReward.findOne({ user: req.user.id });
    if (!reward) reward = new UserReward({ user: req.user.id });

    // Streak logic
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const lastDate = reward.lastActivityDate?.toISOString().split('T')[0];

    if (lastDate === yesterdayStr) {
      reward.currentStreak += 1;
    } else if (lastDate !== today) {
      reward.currentStreak = 1;
    }

    // Streak bonus
    let streakBonus = 0;
    if (reward.currentStreak === 7) streakBonus = 20;
    if (reward.currentStreak === 30) streakBonus = 100;

    const totalEarned = pointsEarned + streakBonus;
    reward.totalPoints += totalEarned;
    reward.lifetimePoints += totalEarned;
    reward.lessonsCompleted += 1;
    if (isCorrect) reward.correctAnswers += 1;
    reward.lastActivityDate = new Date();

    // Badge logic
    if (reward.lessonsCompleted === 1 && !reward.badges.includes('🎓 First Lesson')) reward.badges.push('🎓 First Lesson');
    if (reward.correctAnswers >= 10 && !reward.badges.includes('🧠 Quiz Master')) reward.badges.push('🧠 Quiz Master');
    if (reward.currentStreak >= 7 && !reward.badges.includes('🔥 Week Streak')) reward.badges.push('🔥 Week Streak');
    if (reward.currentStreak >= 30 && !reward.badges.includes('💎 Month Streak')) reward.badges.push('💎 Month Streak');
    if (reward.lifetimePoints >= 500 && !reward.badges.includes('🏆 500 Club')) reward.badges.push('🏆 500 Club');

    await reward.save();

    res.json({
      correct: isCorrect,
      correctIndex: lesson.mcq.correctIndex,
      explanation: lesson.mcq.explanation,
      pointsEarned: totalEarned,
      streakBonus,
      currentStreak: reward.currentStreak,
      totalPoints: reward.totalPoints,
      newBadges: streakBonus > 0 ? [`🔥 ${reward.currentStreak} din ki streak! +${streakBonus} bonus points`] : [],
    });
  } catch (err) {
    console.error('Answer error:', err);
    res.status(500).json({ message: err.message });
  }
};
