import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Target, Calendar, TrendingDown, AlertTriangle,
  CheckCircle, Sparkles, RefreshCw, Lightbulb, ListChecks
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#6b7280'];

const STATUS_STYLE = {
  Great:   { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  Good:    { color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/30'       },
  Average: { color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/30'   },
  Poor:    { color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30'         },
};

// ── Set Target Form ──────────────────────────────────────────────────────────
function SetTargetForm({ onSaved }) {
  const [form, setForm] = useState({ amount: '', type: 'monthly' });
  const [loading, setLoading] = useState(false);

  const TYPES = [
    { val: 'daily',   label: 'Daily',   desc: 'Roz ka limit set karo'       },
    { val: 'weekly',  label: 'Weekly',  desc: 'Hafte ka limit set karo'     },
    { val: 'monthly', label: 'Monthly', desc: 'Poore mahine ka limit set karo' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/budget/target', { amount: Number(form.amount), type: form.type });
      toast.success('Budget target set ho gaya! 🎯');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Target set nahi hua');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card max-w-lg">
      <h3 className="font-semibold text-white mb-5 flex items-center gap-2">
        <Target className="w-5 h-5 text-blue-400" /> Budget Target Set Karo
      </h3>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="label">Monthly Budget Amount (₹)</label>
          <input className="input text-lg font-semibold" type="number" placeholder="20000"
            value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
            required min={1} />
          <p className="text-gray-500 text-xs mt-1">Is mahine itne se zyada nahi kharunga</p>
        </div>

        <div>
          <label className="label">Track Kaise Karna Hai?</label>
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map(({ val, label, desc }) => (
              <button key={val} type="button"
                onClick={() => setForm(f => ({ ...f, type: val }))}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  form.type === val
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}>
                <p className="text-white text-sm font-semibold">{label}</p>
                <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        {form.amount > 0 && (
          <div className="bg-gray-800 rounded-xl p-3 space-y-1 text-sm">
            {form.type === 'daily' && (
              <p className="text-gray-300">📅 Daily limit: <span className="text-white font-bold">₹{Math.round(form.amount / 30).toLocaleString()}</span></p>
            )}
            {form.type === 'weekly' && (
              <p className="text-gray-300">📅 Weekly limit: <span className="text-white font-bold">₹{Math.round(form.amount / 4).toLocaleString()}</span></p>
            )}
            {form.type === 'monthly' && (
              <p className="text-gray-300">📅 Monthly limit: <span className="text-white font-bold">₹{Number(form.amount).toLocaleString()}</span></p>
            )}
            <p className="text-gray-500 text-xs">70%, 90%, 100% pe notification aayegi</p>
          </div>
        )}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Setting...' : '🎯 Target Set Karo'}
        </button>
      </form>
    </div>
  );
}

// ── Budget Status Card ───────────────────────────────────────────────────────
function BudgetStatus({ status, onReset }) {
  const { target, monthlySpent, periodSpent, periodLimit, monthlyPct,
          periodPct, remaining, daysLeft, dailyAllowance, isExceeded } = status;

  const barColor = monthlyPct >= 100 ? 'bg-red-500'
    : monthlyPct >= 90 ? 'bg-red-400'
    : monthlyPct >= 70 ? 'bg-yellow-400'
    : 'bg-emerald-500';

  const TYPE_LABEL = { daily: 'Aaj', weekly: 'Is Hafte', monthly: 'Is Mahine' };

  return (
    <div className="space-y-4">
      {/* Main Progress Card */}
      <div className={`card border-2 ${isExceeded ? 'border-red-500/50' : monthlyPct >= 90 ? 'border-yellow-500/50' : 'border-gray-700'}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-gray-400 text-sm">Monthly Budget Target</p>
            <p className="text-3xl font-bold text-white">₹{target.amount.toLocaleString()}</p>
            <p className="text-gray-500 text-xs mt-1 capitalize">{target.type} tracking</p>
          </div>
          <div className="text-right">
            {isExceeded ? (
              <span className="bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold px-3 py-1.5 rounded-full">
                🚨 Exceeded!
              </span>
            ) : monthlyPct >= 90 ? (
              <span className="bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-xs font-bold px-3 py-1.5 rounded-full">
                ⚠️ Danger Zone
              </span>
            ) : (
              <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full">
                ✓ On Track
              </span>
            )}
          </div>
        </div>

        {/* Monthly Progress Bar */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Monthly Progress</span>
            <span className={`font-bold ${isExceeded ? 'text-red-400' : 'text-white'}`}>{Math.min(monthlyPct, 100)}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
            <div className={`h-4 rounded-full transition-all duration-700 ${barColor}`}
              style={{ width: `${Math.min(monthlyPct, 100)}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>₹{monthlySpent.toLocaleString()} kharch</span>
            <span>₹{Math.max(0, remaining).toLocaleString()} bacha</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Kharch Hua', value: `₹${monthlySpent.toLocaleString()}`, color: 'text-red-400' },
            { label: 'Bacha Hai', value: `₹${Math.max(0, remaining).toLocaleString()}`, color: remaining > 0 ? 'text-emerald-400' : 'text-red-400' },
            { label: 'Din Bache', value: `${daysLeft} din`, color: 'text-blue-400' },
            { label: 'Roz Ka Budget', value: `₹${dailyAllowance.toLocaleString()}`, color: 'text-yellow-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-800 rounded-xl p-3 text-center">
              <p className="text-gray-500 text-xs">{label}</p>
              <p className={`font-bold text-sm mt-0.5 ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Period Progress (daily/weekly) */}
      {target.type !== 'monthly' && (
        <div className="card">
          <h4 className="font-medium text-white mb-3">{TYPE_LABEL[target.type]} Ka Progress</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{TYPE_LABEL[target.type]} limit: ₹{periodLimit.toLocaleString()}</span>
              <span className="font-bold text-white">{Math.min(periodPct, 100)}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3">
              <div className={`h-3 rounded-full transition-all ${periodPct >= 100 ? 'bg-red-500' : periodPct >= 80 ? 'bg-yellow-400' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(periodPct, 100)}%` }} />
            </div>
            <p className="text-gray-500 text-xs">
              ₹{periodSpent.toLocaleString()} / ₹{periodLimit.toLocaleString()} {target.type === 'daily' ? 'aaj' : 'is hafte'}
            </p>
          </div>
        </div>
      )}

      {/* Reset Button */}
      <button onClick={onReset}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors">
        <RefreshCw className="w-4 h-4" /> Target change karna hai?
      </button>
    </div>
  );
}

// ── Month Summary ────────────────────────────────────────────────────────────
function MonthSummary() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/budget/month-summary');
      setSummary(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Summary load nahi hua');
    } finally {
      setLoading(false);
    }
  };

  const statusStyle = STATUS_STYLE[summary?.aiSummary?.overallStatus] || STATUS_STYLE.Average;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-400" /> Month End AI Summary
        </h3>
        <button onClick={fetchSummary} disabled={loading}
          className="flex items-center gap-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
          <Sparkles className="w-4 h-4" />
          {loading ? 'Generating...' : 'AI Summary Generate Karo'}
        </button>
      </div>

      {!summary && !loading && (
        <div className="card flex flex-col items-center justify-center py-12 text-center">
          <Calendar className="w-12 h-12 text-gray-700 mb-3" />
          <p className="text-gray-400 font-medium">Is mahine ka AI summary dekho</p>
          <p className="text-gray-600 text-sm mt-1">Pie chart + action plan milega</p>
        </div>
      )}

      {loading && (
        <div className="card flex flex-col items-center justify-center py-12">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-gray-400">AI summary bana raha hai...</p>
        </div>
      )}

      {summary && !loading && (
        <div className="space-y-4">
          {/* Overall Status */}
          <div className={`card border ${statusStyle.bg}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Overall Status</p>
                <p className={`text-2xl font-bold ${statusStyle.color}`}>
                  {summary.aiSummary?.statusEmoji} {summary.aiSummary?.overallStatus}
                </p>
              </div>
              <div className="text-right space-y-1">
                <div>
                  <p className="text-gray-500 text-xs">Total Spent</p>
                  <p className="text-white font-bold">₹{summary.totalSpent?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Savings</p>
                  <p className={`font-bold ${summary.savings >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    ₹{summary.savings?.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            {summary.target && (
              <div className={`mt-3 flex items-center gap-2 text-sm ${summary.targetAchieved ? 'text-emerald-400' : 'text-red-400'}`}>
                {summary.targetAchieved
                  ? <><CheckCircle className="w-4 h-4" /> Budget target achieve kar liya! 🎉</>
                  : <><AlertTriangle className="w-4 h-4" /> Budget target miss ho gaya</>}
              </div>
            )}
          </div>

          {/* Pie Chart + Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card">
              <h4 className="font-medium text-white mb-3">Expense Breakdown</h4>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={summary.chartData} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" outerRadius={80}
                    label={({ name, percentage }) => `${name} ${percentage}%`} labelLine={false}>
                    {summary.chartData?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `₹${v.toLocaleString()}`}
                    contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="card space-y-3">
              <h4 className="font-medium text-white">AI Summary</h4>
              <p className="text-gray-300 text-sm leading-relaxed">{summary.aiSummary?.summary}</p>
              <div className="space-y-2 pt-2 border-t border-gray-700">
                <div className="flex gap-2 text-sm">
                  <span className="text-gray-500 flex-shrink-0">🏆 Best:</span>
                  <span className="text-emerald-400">{summary.aiSummary?.biggestWin}</span>
                </div>
                <div className="flex gap-2 text-sm">
                  <span className="text-gray-500 flex-shrink-0">⚠️ Concern:</span>
                  <span className="text-yellow-400">{summary.aiSummary?.biggestConcern}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Plan */}
          <div className="card">
            <h4 className="font-medium text-white mb-4 flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-blue-400" /> Next Month Action Plan
            </h4>
            <div className="space-y-3">
              {summary.aiSummary?.actionPlan?.map((step) => (
                <div key={step.step} className="flex gap-3 p-3 bg-gray-800 rounded-xl">
                  <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                    {step.step}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{step.action}</p>
                    <p className="text-emerald-400 text-xs mt-0.5">💰 {step.impact}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Month Goal + Motivation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card bg-blue-500/10 border-blue-500/30">
              <div className="flex gap-3">
                <Target className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium text-sm mb-1">Next Month Goal</p>
                  <p className="text-gray-300 text-sm">{summary.aiSummary?.nextMonthGoal}</p>
                </div>
              </div>
            </div>
            <div className="card bg-purple-500/10 border-purple-500/30">
              <div className="flex gap-3">
                <Lightbulb className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-medium text-sm mb-1">Motivation</p>
                  <p className="text-gray-300 text-sm">{summary.aiSummary?.motivationalMessage}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main BudgetTarget Component ──────────────────────────────────────────────
export default function BudgetTarget() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('tracker');

  const fetchStatus = async () => {
    try {
      const { data } = await axios.get('/api/budget/status');
      setStatus(data);
      setShowForm(!data.hasTarget);
    } catch {
      setShowForm(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <Target className="w-6 h-6 text-blue-400" /> Budget Target & Tracking
      </h2>

      {/* Tabs */}
      <div className="flex bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit gap-1">
        {[
          { val: 'tracker', label: '🎯 Budget Tracker' },
          { val: 'summary', label: '📊 Month Summary' },
        ].map(({ val, label }) => (
          <button key={val} onClick={() => setActiveTab(val)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === val ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'tracker' && (
        <>
          {showForm
            ? <SetTargetForm onSaved={() => { setShowForm(false); fetchStatus(); }} />
            : status?.hasTarget && <BudgetStatus status={status} onReset={() => setShowForm(true)} />
          }
        </>
      )}

      {activeTab === 'summary' && <MonthSummary />}
    </div>
  );
}
