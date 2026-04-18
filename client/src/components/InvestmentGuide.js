import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, LineChart, Line, CartesianGrid,
} from 'recharts';
import { TrendingUp, Sparkles, Calculator, GitCompare, Lightbulb, AlertTriangle, CheckCircle, Info, ClipboardList, ArrowRight, RotateCcw } from 'lucide-react';

// ── Risk Questionnaire ───────────────────────────────────────────────────────
const QUESTIONS = [
  {
    id: 'age',
    question: 'Aapki umar kitni hai?',
    emoji: '🎂',
    options: [
      { label: '20 - 30 saal', score: 4 },
      { label: '31 - 40 saal', score: 3 },
      { label: '41 - 50 saal', score: 2 },
      { label: '50+ saal',     score: 1 },
    ],
  },
  {
    id: 'savings',
    question: 'Aap apni income ka kitna % save karte ho?',
    emoji: '💰',
    options: [
      { label: '30% ya zyada',  score: 4 },
      { label: '20% - 30%',     score: 3 },
      { label: '10% - 20%',     score: 2 },
      { label: '10% se kam',    score: 1 },
    ],
  },
  {
    id: 'horizon',
    question: 'Kitne saal ke liye invest karna chahte ho?',
    emoji: '📅',
    options: [
      { label: '7+ saal',    score: 4 },
      { label: '3 - 7 saal', score: 3 },
      { label: '1 - 3 saal', score: 2 },
      { label: '1 saal se kam', score: 1 },
    ],
  },
  {
    id: 'reaction',
    question: 'Agar tumhara investment 20% gir jaaye toh tum kya karoge?',
    emoji: '📉',
    options: [
      { label: 'Aur zyada invest karunga — sasta mil raha hai!', score: 4 },
      { label: 'Wait karunga — recover ho jaayega',              score: 3 },
      { label: 'Thoda ghabra jaunga par rukuunga',               score: 2 },
      { label: 'Turant nikal lunga — loss nahi sehna',           score: 1 },
    ],
  },
  {
    id: 'loan',
    question: 'Kya abhi koi loan ya EMI chal rahi hai?',
    emoji: '🏦',
    options: [
      { label: 'Koi loan nahi hai',              score: 4 },
      { label: 'Chhota loan hai — manage ho raha hai', score: 3 },
      { label: 'Bada loan hai par income stable hai',  score: 2 },
      { label: 'Bahut zyada EMI hai',            score: 1 },
    ],
  },
  {
    id: 'emergency',
    question: 'Kya tumhare paas 3-6 mahine ka emergency fund hai?',
    emoji: '🛡️',
    options: [
      { label: 'Haan, 6+ mahine ka fund hai',   score: 4 },
      { label: 'Haan, 3-6 mahine ka hai',       score: 3 },
      { label: 'Thoda hai, 1-2 mahine ka',      score: 2 },
      { label: 'Nahi hai abhi',                 score: 1 },
    ],
  },
];

const RISK_RESULT = {
  low:      { label: 'Low Risk',      emoji: '🛡️', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', desc: 'Tum conservative investor ho. Capital safety tumhare liye sabse important hai. Safe instruments best hain.' },
  moderate: { label: 'Moderate Risk', emoji: '⚖️', color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/30',  desc: 'Tum balanced investor ho. Thoda risk le sakte ho better returns ke liye. Mix portfolio best hai.' },
  high:     { label: 'High Risk',     emoji: '🚀', color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30',         desc: 'Tum aggressive investor ho. Long term mein maximum returns chahiye. Equity heavy portfolio best hai.' },
};

function RiskQuestionnaire({ onComplete }) {
  const [current, setCurrent]   = useState(0);
  const [answers, setAnswers]   = useState({});
  const [result,  setResult]    = useState(null);

  const handleAnswer = (score) => {
    const newAnswers = { ...answers, [QUESTIONS[current].id]: score };
    setAnswers(newAnswers);

    if (current < QUESTIONS.length - 1) {
      setCurrent(current + 1);
    } else {
      // Calculate risk
      const total = Object.values(newAnswers).reduce((s, v) => s + v, 0);
      const maxScore = QUESTIONS.length * 4; // 24
      const pct = (total / maxScore) * 100;
      const risk = pct >= 70 ? 'high' : pct >= 45 ? 'moderate' : 'low';
      setResult({ risk, total, maxScore, pct: Math.round(pct) });
    }
  };

  const reset = () => { setCurrent(0); setAnswers({}); setResult(null); };
  const q = QUESTIONS[current];
  const progress = ((current) / QUESTIONS.length) * 100;

  // Result Screen
  if (result) {
    const r = RISK_RESULT[result.risk];
    return (
      <div className="max-w-xl mx-auto space-y-5">
        <div className={`card border text-center ${r.bg}`}>
          <div className="text-5xl mb-3">{r.emoji}</div>
          <h3 className="text-2xl font-bold text-white mb-1">{r.label}</h3>
          <p className={`text-lg font-semibold ${r.color} mb-3`}>
            Score: {result.total}/{result.maxScore} ({result.pct}%)
          </p>
          <p className="text-gray-300 text-sm leading-relaxed">{r.desc}</p>
        </div>

        {/* Score Breakdown */}
        <div className="card">
          <h4 className="font-medium text-white mb-3">Tumhara Risk Score</h4>
          <div className="w-full bg-gray-800 rounded-full h-4 mb-2">
            <div
              className={`h-4 rounded-full transition-all duration-700 ${
                result.risk === 'high' ? 'bg-red-500' : result.risk === 'moderate' ? 'bg-yellow-400' : 'bg-emerald-500'
              }`}
              style={{ width: `${result.pct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>🛡️ Low Risk (0-44%)</span>
            <span>⚖️ Moderate (45-69%)</span>
            <span>🚀 High (70-100%)</span>
          </div>
        </div>

        {/* Answer Summary */}
        <div className="card">
          <h4 className="font-medium text-white mb-3">Tumhare Jawab</h4>
          <div className="space-y-2">
            {QUESTIONS.map((q) => {
              const score = answers[q.id];
              const chosen = q.options.find(o => o.score === score);
              return (
                <div key={q.id} className="flex items-start gap-3 text-sm">
                  <span className="text-lg flex-shrink-0">{q.emoji}</span>
                  <div>
                    <p className="text-gray-400 text-xs">{q.question}</p>
                    <p className="text-white">{chosen?.label}</p>
                  </div>
                  <span className={`ml-auto text-xs font-bold flex-shrink-0 ${
                    score >= 3 ? 'text-emerald-400' : score === 2 ? 'text-yellow-400' : 'text-red-400'
                  }`}>{score}/4</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={reset} className="btn-secondary flex items-center gap-2 flex-1">
            <RotateCcw className="w-4 h-4" /> Dobara Karo
          </button>
          <button
            onClick={() => onComplete(result.risk)}
            className="btn-primary flex items-center gap-2 flex-1">
            Investment Plan Dekho <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Question Screen
  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* Progress */}
      <div>
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Question {current + 1} of {QUESTIONS.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Question Card */}
      <div className="card">
        <div className="text-4xl mb-4 text-center">{q.emoji}</div>
        <h3 className="text-white font-semibold text-lg text-center mb-6">{q.question}</h3>
        <div className="space-y-3">
          {q.options.map((opt, i) => (
            <button key={i} onClick={() => handleAnswer(opt.score)}
              className="w-full text-left p-4 rounded-xl border border-gray-700 hover:border-blue-500 hover:bg-blue-500/10 text-gray-300 hover:text-white transition-all text-sm font-medium">
              <span className="text-gray-500 mr-3">{String.fromCharCode(65 + i)}.</span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Previous answers indicator */}
      <div className="flex gap-2 justify-center">
        {QUESTIONS.map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full ${
            i < current ? 'bg-blue-500' : i === current ? 'bg-white' : 'bg-gray-700'
          }`} />
        ))}
      </div>
    </div>
  );
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

const RISK_INFO = {
  low:      { label: 'Low Risk',      desc: 'Capital preservation. Stable, predictable returns.', color: 'text-emerald-400' },
  moderate: { label: 'Moderate Risk', desc: 'Balanced growth with manageable risk.',               color: 'text-yellow-400'  },
  high:     { label: 'High Risk',     desc: 'Maximum growth potential. Suitable for long-term.',   color: 'text-red-400'     },
};

const RISK_BADGE = {
  'None':       'bg-emerald-500/20 text-emerald-400',
  'Low':        'bg-blue-500/20 text-blue-400',
  'Low-Medium': 'bg-yellow-500/20 text-yellow-400',
  'High':       'bg-orange-500/20 text-orange-400',
  'Very High':  'bg-red-500/20 text-red-400',
};

// ── Tab 1: Recommendation ────────────────────────────────────────────────────
function RecommendationTab({ detectedRisk }) {
  const [form, setForm] = useState({ amount: '', horizon: 'short', risk: detectedRisk || 'moderate' });
  const [result, setResult] = useState(null);
  const [aiAdvice, setAiAdvice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAiAdvice(null);
    try {
      const { data } = await axios.post('/api/investment/recommend', {
        amount: Number(form.amount), horizon: form.horizon, risk: form.risk,
      });
      setResult(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to get recommendation');
    } finally {
      setLoading(false);
    }
  };

  const handleAIAdvice = async () => {
    if (!result) return;
    setAiLoading(true);
    try {
      const { data } = await axios.post('/api/investment/ai-advice', {
        amount: result.totalAmount,
        horizon: result.horizon,
        risk: result.risk,
        allocation: result.allocation,
      });
      setAiAdvice(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI advice nahi mila');
    } finally {
      setAiLoading(false);
    }
  };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="card">
          <h3 className="font-semibold text-white mb-5 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" /> Apna Investment Plan Pao
          </h3>
          {detectedRisk && (
            <div className={`mb-4 p-3 rounded-xl border text-sm flex items-center gap-2 ${
              detectedRisk === 'high' ? 'bg-red-500/10 border-red-500/30 text-red-300' :
              detectedRisk === 'moderate' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300' :
              'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}>
              <ClipboardList className="w-4 h-4 flex-shrink-0" />
              Quiz se detected risk: <span className="font-bold capitalize ml-1">{detectedRisk}</span> — auto-select ho gaya!
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Investable Amount (₹)</label>
              <input className="input" type="number" placeholder="10000"
                value={form.amount} onChange={set('amount')} required min={100} />
            </div>

            <div>
              <label className="label">Time Horizon</label>
              <div className="grid grid-cols-2 gap-2">
                {[{ val: 'short', label: 'Short Term', sub: '< 3 years' },
                  { val: 'long',  label: 'Long Term',  sub: '3+ years'  }].map(({ val, label, sub }) => (
                  <button key={val} type="button" onClick={() => setForm(f => ({ ...f, horizon: val }))}
                    className={`p-3 rounded-xl border text-left transition-colors ${
                      form.horizon === val ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-600'
                    }`}>
                    <p className="text-sm font-medium text-white">{label}</p>
                    <p className="text-xs text-gray-400">{sub}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Risk Appetite</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(RISK_INFO).map(([val, { label, color }]) => (
                  <button key={val} type="button" onClick={() => setForm(f => ({ ...f, risk: val }))}
                    className={`p-3 rounded-xl border text-center transition-colors ${
                      form.risk === val ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-600'
                    }`}>
                    <p className={`text-sm font-semibold ${color}`}>{label}</p>
                  </button>
                ))}
              </div>
              {form.risk && <p className="text-xs text-gray-400 mt-2">{RISK_INFO[form.risk]?.desc}</p>}
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Analyzing...' : 'Get Recommendation'}
            </button>
          </form>
        </div>

        {/* Result */}
        {result ? (
          <div className="card space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-white">Recommended Allocation</h3>
                <p className="text-gray-400 text-sm mt-1">
                  ₹{Number(result.totalAmount).toLocaleString()} · {result.horizon}-term · {result.risk} risk · {result.years} years
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Projected Value</p>
                <p className="text-emerald-400 font-bold">₹{result.totalProjected?.toLocaleString()}</p>
                <p className="text-xs text-emerald-600">+₹{result.totalProfit?.toLocaleString()} profit</p>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={result.allocation} dataKey="pct" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                  {result.allocation.map((item, i) => <Cell key={i} fill={item.color || COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(v, n, p) => [`${v}% — ₹${p.payload.investAmount.toLocaleString()}`, n]}
                  contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-2">
              {result.allocation.map((item, i) => (
                <div key={item.name} className="p-3 bg-gray-800 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: item.color || COLORS[i] }} />
                      <span className="text-white text-sm font-medium">{item.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${RISK_BADGE[item.risk] || 'bg-gray-700 text-gray-400'}`}>
                        {item.risk}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-white font-bold text-sm">{item.pct}%</span>
                      <span className="text-gray-400 text-xs ml-2">₹{item.investAmount?.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between ml-5">
                    <p className="text-gray-500 text-xs">{item.tip}</p>
                    <p className="text-emerald-400 text-xs">→ ₹{item.projectedAmount?.toLocaleString()}</p>
                  </div>
                  {/* Risk explanation */}
                  <p className="text-gray-600 text-xs ml-5 mt-1 italic">{item.riskExplain}</p>
                </div>
              ))}
            </div>

            {/* AI Advice Button */}
            <button onClick={handleAIAdvice} disabled={aiLoading}
              className="w-full flex items-center justify-center gap-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 py-2.5 rounded-xl transition-colors disabled:opacity-50">
              <Sparkles className="w-4 h-4" />
              {aiLoading ? 'AI Advice Generate Ho Raha Hai...' : 'AI Personalized Advice Lo (Hinglish)'}
            </button>
          </div>
        ) : (
          <div className="card flex items-center justify-center min-h-[300px]">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-700" />
              <p className="text-gray-500">Form bharo aur apna investment plan pao</p>
            </div>
          </div>
        )}
      </div>

      {/* AI Advice Section */}
      {aiAdvice && (
        <div className="space-y-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" /> AI Personalized Advice
          </h3>

          <div className="card bg-purple-500/10 border-purple-500/30">
            <div className="flex gap-3">
              <Lightbulb className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-medium mb-1">Tumhare Liye Khaas Advice</p>
                <p className="text-gray-300 text-sm leading-relaxed">{aiAdvice.personalizedSummary}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card">
              <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> Ye Plan Kyun Best Hai
              </h4>
              <p className="text-gray-300 text-sm leading-relaxed">{aiAdvice.whyThisPlan}</p>

              <h4 className="font-medium text-white mt-4 mb-3">Kaise Shuru Karo</h4>
              <div className="space-y-2">
                {aiAdvice.howToStart?.map((step, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                      {i + 1}
                    </div>
                    <p className="text-gray-300">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card space-y-4">
              <div>
                <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" /> Important Warnings
                </h4>
                <div className="space-y-2">
                  {aiAdvice.importantWarnings?.map((w, i) => (
                    <div key={i} className="flex gap-2 text-sm bg-yellow-500/10 border border-yellow-500/20 p-2 rounded-lg">
                      <span className="text-yellow-400 flex-shrink-0">⚠️</span>
                      <p className="text-gray-300">{w}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl">
                <p className="text-blue-300 text-sm"><span className="font-medium">Alternative:</span> {aiAdvice.alternativeTip}</p>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                <p className="text-emerald-300 text-sm">💪 {aiAdvice.motivationalNote}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab 2: Returns Calculator ────────────────────────────────────────────────
function ReturnsCalculator() {
  const [form, setForm] = useState({ amount: '', years: '5' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCalc = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post('/api/investment/returns-calc', {
        amount: Number(form.amount), years: Number(form.years),
      });
      setResult(data);
    } catch (err) {
      toast.error('Calculation nahi hua');
    } finally {
      setLoading(false);
    }
  };

  // Build chart data for line chart
  const buildGrowthData = () => {
    if (!result) return [];
    const points = [];
    for (let y = 0; y <= result.years; y++) {
      const point = { year: `Year ${y}` };
      result.lumpsum.forEach((inst) => {
        point[inst.name] = Math.round(result.amount * Math.pow(1 + inst.rate / 100, y));
      });
      points.push(point);
    }
    return points;
  };

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="card max-w-lg">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-400" /> Returns Calculator
        </h3>
        <form onSubmit={handleCalc} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount (₹)</label>
              <input className="input" type="number" placeholder="50000"
                value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} required min={100} />
            </div>
            <div>
              <label className="label">Years</label>
              <select className="input" value={form.years} onChange={(e) => setForm(f => ({ ...f, years: e.target.value }))}>
                {[1, 2, 3, 5, 7, 10, 15, 20].map(y => <option key={y} value={y}>{y} Years</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Calculating...' : 'Calculate Returns'}
          </button>
        </form>
      </div>

      {result && (
        <div className="space-y-6">
          {/* Lumpsum Results */}
          <div className="card">
            <h4 className="font-medium text-white mb-4">Lumpsum ₹{Number(result.amount).toLocaleString()} — {result.years} Saal Baad</h4>
            <div className="space-y-3">
              {result.lumpsum.map((inst) => (
                <div key={inst.name} className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: inst.color }} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white text-sm font-medium">{inst.name}</span>
                      <div className="text-right">
                        <span className="text-white font-bold">₹{inst.finalAmount.toLocaleString()}</span>
                        <span className="text-emerald-400 text-xs ml-2">+{inst.growthPct}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="h-2 rounded-full" style={{ width: `${Math.min(inst.growthPct, 100)}%`, background: inst.color }} />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{inst.rate}% annual · {inst.risk} risk</span>
                      <span>Profit: ₹{inst.profit.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SIP Results */}
          <div className="card">
            <h4 className="font-medium text-white mb-1">SIP Option — ₹{result.lumpsum[0] && Math.round(result.amount / 12).toLocaleString()}/month for {result.years} years</h4>
            <p className="text-gray-500 text-xs mb-4">Same amount ko monthly invest karo</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {result.sip.map((inst) => (
                <div key={inst.name} className="p-4 bg-gray-800 rounded-xl border border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: inst.color }} />
                    <span className="text-white text-sm font-medium">{inst.name}</span>
                  </div>
                  <p className="text-2xl font-bold text-white">₹{inst.finalAmount.toLocaleString()}</p>
                  <p className="text-gray-400 text-xs mt-1">Invested: ₹{inst.totalInvested.toLocaleString()}</p>
                  <p className="text-emerald-400 text-xs">Profit: ₹{inst.profit.toLocaleString()} (+{inst.growthPct}%)</p>
                </div>
              ))}
            </div>
          </div>

          {/* Growth Line Chart */}
          <div className="card">
            <h4 className="font-medium text-white mb-4">Growth Chart — Year by Year</h4>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={buildGrowthData()} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="year" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => `₹${v.toLocaleString()}`}
                  contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 11 }} />
                {result.lumpsum.map((inst) => (
                  <Line key={inst.name} type="monotone" dataKey={inst.name}
                    stroke={inst.color} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab 3: Compare Instruments ───────────────────────────────────────────────
function CompareInstruments() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  const fetchCompare = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/investment/compare');
      setData(data);
    } catch {
      toast.error('Comparison load nahi hua');
    } finally {
      setLoading(false);
    }
  };

  if (!data && !loading) return (
    <div className="card flex flex-col items-center justify-center py-16 text-center">
      <GitCompare className="w-12 h-12 text-gray-700 mb-3" />
      <p className="text-gray-400 mb-4">FD vs SIP vs Gold vs PPF vs Stocks — sab compare karo</p>
      <button onClick={fetchCompare} className="btn-primary flex items-center gap-2">
        <GitCompare className="w-4 h-4" /> Compare Karo
      </button>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-white">Investment Instruments Comparison</h3>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((inst) => (
          <div key={inst.name}
            onClick={() => setSelected(selected?.name === inst.name ? null : inst)}
            className={`card cursor-pointer transition-all border-2 ${
              selected?.name === inst.name ? 'border-blue-500' : 'border-gray-800 hover:border-gray-600'
            }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{inst.emoji}</span>
                <span className="text-white font-semibold text-sm">{inst.name}</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${RISK_BADGE[inst.risk] || 'bg-gray-700 text-gray-400'}`}>
                {inst.risk}
              </span>
            </div>

            <div className="space-y-1 text-xs">
              {[
                { label: 'Returns', value: inst.returns, color: 'text-emerald-400' },
                { label: 'Liquidity', value: inst.liquidity, color: 'text-blue-400' },
                { label: 'Min Amount', value: inst.minAmount, color: 'text-white' },
                { label: 'Lock-in', value: inst.lockIn, color: 'text-yellow-400' },
                { label: 'Tax', value: inst.taxable, color: 'text-gray-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-500">{label}:</span>
                  <span className={`font-medium ${color}`}>{value}</span>
                </div>
              ))}
            </div>

            <p className="text-gray-400 text-xs mt-3 pt-3 border-t border-gray-700 italic">
              {inst.hinglishExplain}
            </p>
          </div>
        ))}
      </div>

      {/* Detail Panel */}
      {selected && (
        <div className="card border border-blue-500/30 bg-blue-500/5">
          <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">{selected.emoji}</span> {selected.name} — Detail
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-emerald-400 text-sm font-medium mb-2 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Fayde (Pros)
              </p>
              <ul className="space-y-1">
                {selected.pros.map((p, i) => (
                  <li key={i} className="text-gray-300 text-sm flex gap-2">
                    <span className="text-emerald-400 flex-shrink-0">✓</span> {p}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-red-400 text-sm font-medium mb-2 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> Nuksan (Cons)
              </p>
              <ul className="space-y-1">
                {selected.cons.map((c, i) => (
                  <li key={i} className="text-gray-300 text-sm flex gap-2">
                    <span className="text-red-400 flex-shrink-0">✗</span> {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-500/10 rounded-xl">
            <p className="text-blue-300 text-sm">
              <span className="font-medium">Best for:</span> {selected.bestFor}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function InvestmentGuide() {
  const [activeTab, setActiveTab]   = useState('quiz');
  const [detectedRisk, setDetectedRisk] = useState(null);

  const handleQuizComplete = (risk) => {
    setDetectedRisk(risk);
    setActiveTab('recommend');
  };

  const TABS = [
    { val: 'quiz',      label: '🎯 Risk Assessment'     },
    { val: 'recommend', label: '📊 Recommendation'      },
    { val: 'returns',   label: '🧮 Returns Calculator'  },
    { val: 'compare',   label: '⚖️ Compare Instruments' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Investment Guidance Engine</h2>

      {/* Tabs */}
      <div className="flex flex-wrap bg-gray-900 border border-gray-800 rounded-xl p-1 gap-1 w-fit">
        {TABS.map(({ val, label }) => (
          <button key={val} onClick={() => setActiveTab(val)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === val ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}>
            {label}
            {val === 'recommend' && detectedRisk && (
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                detectedRisk === 'high' ? 'bg-red-500/30 text-red-300' :
                detectedRisk === 'moderate' ? 'bg-yellow-500/30 text-yellow-300' :
                'bg-emerald-500/30 text-emerald-300'
              }`}>{detectedRisk}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'quiz'      && <RiskQuestionnaire onComplete={handleQuizComplete} />}
      {activeTab === 'recommend' && <RecommendationTab detectedRisk={detectedRisk} />}
      {activeTab === 'returns'   && <ReturnsCalculator />}
      {activeTab === 'compare'   && <CompareInstruments />}
    </div>
  );
}
