import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { BookOpen, CheckCircle, XCircle, Star, Flame, RefreshCw, Newspaper, ExternalLink } from 'lucide-react';

// Realistic Mock Indian Finance News
const FINANCE_NEWS = [
  {
    id: 1,
    source: 'Moneycontrol',
    time: '2 hours ago',
    title: 'RBI keeps repo rate unchanged at 6.5% for 7th consecutive time',
    desc: 'The Monetary Policy Committee (MPC) decided to keep the repo rate unchanged to balance inflation and economic growth. FD aur Loan EMI par filhal koi asar nahi padega.',
    link: 'https://www.moneycontrol.com/news/business/economy/'
  },
  {
    id: 2,
    source: 'Mint',
    time: '4 hours ago',
    title: 'Sensex, Nifty hit new all-time highs amid strong global cues',
    desc: 'Indian equity benchmarks surged aaj, driven by heavy buying in IT and banking stocks. Mutual Fund SIPs also seeing record inflows.',
    link: 'https://www.livemint.com/market'
  },
  {
    id: 3,
    source: 'Economic Times',
    time: '5 hours ago',
    title: 'Gold prices jump to record highs, silver follows suit',
    desc: 'Safe-haven demand aur central bank purchases ki wajah se gold market mein tezi. Experts suggest holding 10% gold in your portfolio.',
    link: 'https://economictimes.indiatimes.com/markets/commodities'
  },
  {
    id: 4,
    source: 'Financial Express',
    time: '1 day ago',
    title: 'Mutual Fund SIP inflows cross ₹19,000 crore mark in a single month',
    desc: 'Retail investors continue to pour money into equity mutual funds via SIPs despite market volatility. Power of compounding in action!',
    link: 'https://www.financialexpress.com/market/mutual-funds/'
  }
];

export default function DailyLesson() {
  const [activeTab, setActiveTab] = useState('lesson');
  const [lesson, setLesson] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchLesson = async () => {
    setLoading(true);
    setSelected(null);
    setResult(null);
    try {
      const { data } = await axios.get('/api/lesson/today');
      setLesson(data.lesson);
      setProgress(data.progress);
      if (data.progress?.answered) setSelected(data.progress.selectedIndex);
    } catch (err) {
      toast.error('Lesson load nahi hua. Internet check karo!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLesson(); }, []);

  const handleSubmit = async () => {
    if (selected === null || submitting) return;
    setSubmitting(true);
    try {
      const { data } = await axios.post('/api/lesson/answer', { selectedIndex: selected });
      setResult(data);
      setProgress({ answered: true, correct: data.correct, selectedIndex: selected });
      // Update lesson with correct answer revealed
      setLesson((prev) => ({
        ...prev,
        mcq: { ...prev.mcq, correctIndex: data.correctIndex, explanation: data.explanation },
      }));
      if (data.correct) {
        toast.success(`🎉 Sahi jawab! +${data.pointsEarned} points mile!`);
      } else {
        toast.error('Galat jawab! Sahi answer dekho neeche.');
      }
      if (data.streakBonus > 0) {
        setTimeout(() => toast.success(`🔥 ${data.currentStreak} din ki streak! +${data.streakBonus} bonus!`), 1000);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submit nahi hua');
    } finally {
      setSubmitting(false);
    }
  };

  const getOptionStyle = (idx) => {
    if (!progress?.answered) {
      return selected === idx
        ? 'border-blue-500 bg-blue-500/10 text-white'
        : 'border-gray-700 hover:border-gray-500 text-gray-300 cursor-pointer';
    }
    if (idx === lesson?.mcq?.correctIndex) return 'border-emerald-500 bg-emerald-500/10 text-emerald-400';
    if (idx === selected && !progress?.correct) return 'border-red-500 bg-red-500/10 text-red-400';
    return 'border-gray-700 text-gray-500';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400">Aaj ka lesson Gemini se generate ho raha hai...</p>
      </div>
    );
  }

  if (!lesson) return (
    <div className="text-center py-20">
      <p className="text-gray-400 mb-4">Lesson load nahi hua</p>
      <button onClick={fetchLesson} className="btn-primary flex items-center gap-2 mx-auto">
        <RefreshCw className="w-4 h-4" /> Dobara try karo
      </button>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-400" /> Learn & Grow
        </h2>
        <div className="flex bg-gray-900 border border-gray-800 rounded-xl p-1 gap-1">
          <button onClick={() => setActiveTab('lesson')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'lesson' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}>
            <BookOpen className="w-4 h-4" /> Daily Lesson
          </button>
          <button onClick={() => setActiveTab('news')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'news' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}>
            <Newspaper className="w-4 h-4" /> Market News
          </button>
        </div>
      </div>

      {activeTab === 'lesson' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-blue-600/20 text-blue-400 border border-blue-500/30 text-sm font-medium px-3 py-1 rounded-full">
                📚 {lesson.topic}
              </span>
              {progress?.answered && (
                <span className={`text-sm font-medium px-3 py-1 rounded-full border ${
                  progress.correct
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                }`}>
                  {progress.correct ? '✓ Sahi jawab diya' : '✗ Galat jawab'}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full hidden sm:block">
              {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>

          {/* Paragraph */}
          <div className="card">
            <p className="text-gray-200 leading-8 text-[15px]">{lesson.paragraph}</p>
          </div>

          {/* MCQ */}
          <div className="card space-y-4">
            <h3 className="font-semibold text-white text-base">
              🤔 {lesson.mcq.question}
            </h3>

        <div className="space-y-2">
          {lesson.mcq.options.map((opt, idx) => (
            <div
              key={idx}
              onClick={() => !progress?.answered && setSelected(idx)}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${getOptionStyle(idx)}`}
            >
              <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                selected === idx && !progress?.answered ? 'border-blue-500 bg-blue-500 text-white' : 'border-current'
              }`}>
                {progress?.answered
                  ? idx === lesson.mcq.correctIndex
                    ? <CheckCircle className="w-4 h-4" />
                    : idx === selected && !progress?.correct
                    ? <XCircle className="w-4 h-4" />
                    : String.fromCharCode(65 + idx)
                  : String.fromCharCode(65 + idx)}
              </div>
              <span className="text-sm">{opt}</span>
            </div>
          ))}
        </div>

        {/* Explanation after answer */}
        {progress?.answered && lesson.mcq.explanation && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <p className="text-blue-300 text-sm">💡 <span className="font-semibold">Explanation:</span> {lesson.mcq.explanation}</p>
          </div>
        )}

        {/* Points earned */}
        {result && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center gap-3">
            <Star className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <div>
              <p className="text-yellow-300 font-semibold">+{result.pointsEarned} Points Mile! 🎉</p>
              {result.streakBonus > 0 && (
                <p className="text-orange-400 text-sm flex items-center gap-1 mt-0.5">
                  <Flame className="w-4 h-4" /> {result.currentStreak} din ki streak bonus: +{result.streakBonus} points
                </p>
              )}
            </div>
          </div>
        )}

        {/* Submit button */}
        {!progress?.answered && (
          <button
            onClick={handleSubmit}
            disabled={selected === null || submitting}
            className="btn-primary w-full"
          >
            {submitting ? 'Submit ho raha hai...' : 'Jawab Submit Karo'}
          </button>
        )}

        {progress?.answered && (
          <p className="text-center text-gray-500 text-sm">
            ✅ Aaj ka lesson complete! Kal naya lesson aayega.
          </p>
        )}
      </div>
        </div>
      )}

      {/* Market News Tab */}
      {activeTab === 'news' && (
        <div className="space-y-4">
          {FINANCE_NEWS.map((news) => (
            <div key={news.id} className="card border border-gray-800 hover:border-gray-600 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg">
                  {news.source}
                </span>
                <span className="text-xs font-medium text-gray-500">{news.time}</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{news.title}</h3>
              <p className="text-gray-400 text-sm mb-4 leading-relaxed">{news.desc}</p>
              <a href={news.link} target="_blank" rel="noopener noreferrer" 
                className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
                Poori news padhein <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ))}
          <div className="text-center py-6">
            <Newspaper className="w-8 h-8 text-gray-700 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Aur news updates jaldi hi aayengi!</p>
          </div>
        </div>
      )}
    </div>
  );
}
