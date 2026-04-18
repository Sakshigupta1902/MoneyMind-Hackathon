import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Target, Plus, Trash2, PiggyBank, CheckCircle, Clock, TrendingUp, X } from 'lucide-react';

const CATEGORIES = ['Emergency Fund', 'Vacation', 'Education', 'Vehicle', 'Home', 'Wedding', 'Gadget', 'Other'];
const CATEGORY_EMOJI = {
  'Emergency Fund': '🛡️', 'Vacation': '✈️', 'Education': '📚',
  'Vehicle': '🚗', 'Home': '🏠', 'Wedding': '💍', 'Gadget': '📱', 'Other': '🎯',
};

const initForm = {
  title: '', targetAmount: '', deadline: '', category: 'Other',
  emoji: '🎯',
};

export default function SavingsGoal() {
  const [goals, setGoals] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initForm);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [contributeGoal, setContributeGoal] = useState(null);
  const [contributeAmount, setContributeAmount] = useState('');
  const [contributeNote, setContributeNote] = useState('');

  const fetchAll = async () => {
    try {
      const [goalsRes, summaryRes] = await Promise.all([
        axios.get('/api/goals'),
        axios.get('/api/goals/summary'),
      ]);
      setGoals(goalsRes.data);
      setSummary(summaryRes.data);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/goals', { ...form, targetAmount: Number(form.targetAmount) });
      toast.success('Goal create ho gaya! 🎯');
      setShowForm(false);
      setForm(initForm);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Goal create nahi hua');
    } finally {
      setLoading(false);
    }
  };

  const handleContribute = async () => {
    if (!contributeAmount || Number(contributeAmount) <= 0) return;
    try {
      await axios.post(`/api/goals/${contributeGoal._id}/contribute`, {
        amount: Number(contributeAmount), note: contributeNote,
      });
      toast.success(`₹${Number(contributeAmount).toLocaleString()} add ho gaya! 💰`);
      setContributeGoal(null);
      setContributeAmount('');
      setContributeNote('');
      fetchAll();
    } catch (err) {
      toast.error('Contribution nahi hua');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/goals/${id}`);
      toast.success('Goal delete ho gaya');
      fetchAll();
    } catch {
      toast.error('Delete nahi hua');
    }
  };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const barColor = (pct) =>
    pct >= 100 ? 'bg-emerald-500' : pct >= 70 ? 'bg-blue-500' : pct >= 40 ? 'bg-yellow-400' : 'bg-red-400';

  if (fetching) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <PiggyBank className="w-6 h-6 text-pink-400" /> Savings Goals
        </h2>
        <button onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Goal
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Goals', value: summary.totalGoals, color: 'text-white', icon: '🎯' },
            { label: 'Total Target', value: `₹${summary.totalTarget?.toLocaleString()}`, color: 'text-blue-400', icon: '💰' },
            { label: 'Total Saved', value: `₹${summary.totalSaved?.toLocaleString()}`, color: 'text-emerald-400', icon: '✅' },
            { label: 'Completed', value: `${summary.completed}/${summary.totalGoals}`, color: 'text-yellow-400', icon: '🏆' },
          ].map(({ label, value, color, icon }) => (
            <div key={label} className="card text-center">
              <p className="text-2xl mb-1">{icon}</p>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-gray-500 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Overall Progress */}
      {summary && summary.totalGoals > 0 && (
        <div className="card">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Overall Savings Progress</span>
            <span className="text-white font-bold">{summary.overallPct}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3">
            <div className="bg-gradient-to-r from-blue-500 to-emerald-500 h-3 rounded-full transition-all duration-700"
              style={{ width: `${summary.overallPct}%` }} />
          </div>
          <p className="text-gray-500 text-xs mt-2">
            ₹{summary.totalSaved?.toLocaleString()} saved out of ₹{summary.totalTarget?.toLocaleString()}
          </p>
        </div>
      )}

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <PiggyBank className="w-14 h-14 text-gray-700 mb-3" />
          <p className="text-gray-400 font-medium">Koi savings goal nahi hai</p>
          <p className="text-gray-600 text-sm mt-1">Apna pehla goal banao!</p>
          <button onClick={() => setShowForm(true)} className="btn-primary mt-4 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Goal Banao
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {goals.map((goal) => (
            <div key={goal._id} className={`card border-2 transition-all ${
              goal.isCompleted ? 'border-emerald-500/40 bg-emerald-500/5' :
              goal.isOverdue ? 'border-red-500/40' : 'border-gray-700'
            }`}>
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{CATEGORY_EMOJI[goal.category] || '🎯'}</span>
                  <div>
                    <h3 className="text-white font-semibold">{goal.title}</h3>
                    <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{goal.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {goal.isCompleted && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                  <button onClick={() => handleDelete(goal._id)}
                    className="text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 transition-colors p-1.5 rounded-lg flex items-center gap-1 text-xs font-medium">
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">₹{goal.savedAmount?.toLocaleString()} saved</span>
                  <span className="text-white font-bold">{goal.pct}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-3">
                  <div className={`h-3 rounded-full transition-all duration-500 ${barColor(goal.pct)}`}
                    style={{ width: `${goal.pct}%` }} />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Target: ₹{goal.targetAmount?.toLocaleString()}</span>
                  <span>Remaining: ₹{goal.remaining?.toLocaleString()}</span>
                </div>
              </div>

              {/* Stats */}
              {!goal.isCompleted && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-gray-800 rounded-lg p-2 text-center">
                    <p className="text-white text-sm font-bold">₹{goal.dailyNeeded?.toLocaleString()}</p>
                    <p className="text-gray-500 text-xs">Roz chahiye</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-2 text-center">
                    <p className="text-white text-sm font-bold">₹{goal.monthlyNeeded?.toLocaleString()}</p>
                    <p className="text-gray-500 text-xs">Monthly chahiye</p>
                  </div>
                  <div className={`rounded-lg p-2 text-center ${goal.daysLeft <= 7 ? 'bg-red-500/20' : 'bg-gray-800'}`}>
                    <p className={`text-sm font-bold ${goal.daysLeft <= 7 ? 'text-red-400' : 'text-white'}`}>
                      {goal.daysLeft}
                    </p>
                    <p className="text-gray-500 text-xs">Din bache</p>
                  </div>
                </div>
              )}

              {/* Affordability */}
              {!goal.isCompleted && (
                <p className={`text-xs mb-3 ${goal.canAfford ? 'text-emerald-400' : 'text-yellow-400'}`}>
                  {goal.canAfford
                    ? '✓ Ye goal tumhari income mein fit hai'
                    : '⚠️ Monthly saving thodi zyada lagegi — plan adjust karo'}
                </p>
              )}

              {/* Completed Badge */}
              {goal.isCompleted && (
                <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-3 mb-3 text-center">
                  <p className="text-emerald-400 font-semibold">🎉 Goal Complete! Bahut badhiya!</p>
                </div>
              )}

              {/* Add Money Button */}
              {!goal.isCompleted && (
                <button onClick={() => setContributeGoal(goal)}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 py-2 rounded-xl text-sm font-medium transition-colors">
                  <Plus className="w-4 h-4" /> Paisa Add Karo
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Goal Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-white text-lg">Naya Savings Goal</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">Goal Title</label>
                <input className="input" placeholder="Goa Trip, New Phone, Emergency Fund..."
                  value={form.title} onChange={set('title')} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Target Amount (₹)</label>
                  <input className="input" type="number" placeholder="50000"
                    value={form.targetAmount} onChange={set('targetAmount')} required min={1} />
                </div>
                <div>
                  <label className="label">Deadline</label>
                  <input className="input" type="date" value={form.deadline} onChange={set('deadline')}
                    min={new Date().toISOString().split('T')[0]} required />
                </div>
              </div>
              <div>
                <label className="label">Category</label>
                <select className="input" value={form.category}
                  onChange={(e) => setForm(f => ({ ...f, category: e.target.value, emoji: CATEGORY_EMOJI[e.target.value] || '🎯' }))}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{CATEGORY_EMOJI[c]} {c}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={loading}>
                  {loading ? 'Creating...' : '🎯 Goal Banao'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contribute Modal */}
      {contributeGoal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Paisa Add Karo</h3>
              <button onClick={() => setContributeGoal(null)} className="text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              {contributeGoal.title} — ₹{contributeGoal.remaining?.toLocaleString()} aur chahiye
            </p>
            <div className="space-y-3">
              <div>
                <label className="label">Amount (₹)</label>
                <input className="input" type="number" placeholder="1000"
                  value={contributeAmount} onChange={(e) => setContributeAmount(e.target.value)} min={1} />
              </div>
              <div>
                <label className="label">Note (optional)</label>
                <input className="input" placeholder="Salary se, Bonus se..."
                  value={contributeNote} onChange={(e) => setContributeNote(e.target.value)} />
              </div>
              {/* Quick amounts */}
              <div className="flex gap-2 flex-wrap">
                {[500, 1000, 2000, 5000].map((amt) => (
                  <button key={amt} type="button"
                    onClick={() => setContributeAmount(String(amt))}
                    className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg border border-gray-700 transition-colors">
                    ₹{amt.toLocaleString()}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setContributeGoal(null)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleContribute} className="btn-primary flex-1"
                  disabled={!contributeAmount}>
                  💰 Add Karo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
