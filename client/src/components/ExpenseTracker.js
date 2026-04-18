import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Trash2, Plus, Sparkles, TrendingUp, TrendingDown,
  AlertTriangle, Lightbulb, Target, RefreshCw
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#6b7280'];
const TREND_ICON = { increasing: '📈', stable: '➡️', decreasing: '📉' };
const HEALTH_COLOR = { Poor: 'text-red-400', Average: 'text-yellow-400', Good: 'text-blue-400', Excellent: 'text-emerald-400' };

const initForm = { amount: '', category: '', description: '', date: new Date().toISOString().split('T')[0] };
const initPlanForm = { salary: '', rent: '', food: '', transport: '', entertainment: '', health: '', shopping: '', education: '', other: '' };

// ─── Manual Tab ──────────────────────────────────────────────────────────────
function ManualTracker() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState(initForm);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);

  useEffect(() => {
    axios.get('/api/expenses')
      .then(({ data }) => setExpenses(data))
      .finally(() => setFetching(false));
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post('/api/expenses', { ...form, amount: Number(form.amount) });
      setExpenses([data, ...expenses]);
      setForm(initForm);
      toast.success('Expense add ho gaya!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Add nahi hua');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/expenses/${id}`);
      setExpenses(expenses.filter((e) => e._id !== id));
      toast.success('Delete ho gaya!');
    } catch {
      toast.error('Delete nahi hua');
    }
  };

  const handlePredict = async () => {
    setPredicting(true);
    try {
      const { data } = await axios.get('/api/expenses/ai-prediction');
      setPrediction(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Prediction nahi hua');
    } finally {
      setPredicting(false);
    }
  };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Add Form */}
      <div className="card">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-blue-400" /> Apna Expense Add Karo
        </h3>
        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="label">Amount (₹)</label>
            <input className="input" type="number" placeholder="500" value={form.amount}
              onChange={set('amount')} required min={1} />
          </div>
          <div>
            <label className="label">Category</label>
            <input className="input" placeholder="Food, Rent, Petrol..." value={form.category}
              onChange={set('category')} required />
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" placeholder="Lunch at office, Uber to station..." value={form.description}
              onChange={set('description')} />
          </div>
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" value={form.date} onChange={set('date')} required />
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      </div>

      {/* Expense List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Saari Expenses</h3>
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">Total: <span className="text-white font-bold">₹{total.toLocaleString()}</span></span>
            <button onClick={handlePredict} disabled={predicting}
              className="flex items-center gap-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-sm px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
              <Sparkles className="w-4 h-4" />
              {predicting ? 'Predicting...' : 'AI Prediction'}
            </button>
          </div>
        </div>

        {fetching ? (
          <p className="text-gray-400 text-center py-8">Load ho raha hai...</p>
        ) : expenses.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Koi expense nahi hai. Pehla expense add karo!</p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {expenses.map((exp) => (
              <div key={exp._id} className="flex items-center justify-between p-3 bg-gray-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium px-2 py-1 rounded-lg bg-blue-500/20 text-blue-400">
                    {exp.category}
                  </span>
                  <div>
                    <p className="text-white text-sm font-medium">{exp.description || exp.category}</p>
                    <p className="text-gray-500 text-xs">{new Date(exp.date).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white font-semibold">₹{exp.amount.toLocaleString()}</span>
                  <button onClick={() => handleDelete(exp._id)}
                    className="text-gray-600 hover:text-red-400 transition-colors p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Prediction Result */}
      {prediction && (
        <div className="space-y-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" /> Next Month AI Prediction
          </h3>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card bg-purple-500/10 border-purple-500/30">
              <p className="text-gray-400 text-sm">Predicted Expense</p>
              <p className="text-2xl font-bold text-white">₹{prediction.predictedTotal?.toLocaleString()}</p>
            </div>
            <div className="card bg-emerald-500/10 border-emerald-500/30">
              <p className="text-gray-400 text-sm">Predicted Savings</p>
              <p className="text-2xl font-bold text-emerald-400">₹{prediction.predictedSavings?.toLocaleString()}</p>
            </div>
            <div className="card bg-blue-500/10 border-blue-500/30">
              <p className="text-gray-400 text-sm">Warning Categories</p>
              <p className="text-sm font-medium text-red-400 mt-1">
                {prediction.warningCategories?.length > 0
                  ? prediction.warningCategories.join(', ')
                  : 'Koi warning nahi 🎉'}
              </p>
            </div>
          </div>

          {/* Top Insight */}
          <div className="card bg-blue-500/10 border-blue-500/30">
            <div className="flex gap-3">
              <Lightbulb className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-medium text-sm mb-1">AI Insight</p>
                <p className="text-gray-300 text-sm leading-relaxed">{prediction.topInsight}</p>
              </div>
            </div>
          </div>

          {/* Category wise prediction */}
          <div className="card">
            <h4 className="font-medium text-white mb-3">Category-wise Prediction</h4>
            <div className="space-y-2">
              {prediction.categoryWise?.map((c) => (
                <div key={c.category} className="flex items-center justify-between p-3 bg-gray-800 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{TREND_ICON[c.trend] || '➡️'}</span>
                    <div>
                      <p className="text-white text-sm font-medium">{c.category}</p>
                      <p className="text-gray-500 text-xs">{c.reason}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold text-sm">₹{c.predictedAmount?.toLocaleString()}</p>
                    <p className={`text-xs ${c.trend === 'increasing' ? 'text-red-400' : c.trend === 'decreasing' ? 'text-emerald-400' : 'text-gray-400'}`}>
                      {c.trend}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Saving Tip */}
          <div className="card bg-emerald-500/10 border-emerald-500/30">
            <div className="flex gap-3">
              <Target className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-medium text-sm mb-1">💡 Saving Tip</p>
                <p className="text-gray-300 text-sm">{prediction.savingTip}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AI Planner Tab ───────────────────────────────────────────────────────────
function AIPlanner() {
  const [form, setForm] = useState(initPlanForm);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const EXPENSE_FIELDS = [
    { key: 'rent', label: 'Rent / Housing', placeholder: '8000', emoji: '🏠' },
    { key: 'food', label: 'Food & Groceries', placeholder: '5000', emoji: '🍱' },
    { key: 'transport', label: 'Transport', placeholder: '2000', emoji: '🚗' },
    { key: 'entertainment', label: 'Entertainment', placeholder: '1500', emoji: '🎬' },
    { key: 'health', label: 'Health & Medical', placeholder: '1000', emoji: '💊' },
    { key: 'shopping', label: 'Shopping', placeholder: '2000', emoji: '🛍️' },
    { key: 'education', label: 'Education', placeholder: '1000', emoji: '📚' },
    { key: 'other', label: 'Other', placeholder: '500', emoji: '📦' },
  ];

  const totalExpenses = EXPENSE_FIELDS.reduce((s, f) => s + (Number(form[f.key]) || 0), 0);
  const savings = (Number(form.salary) || 0) - totalExpenses;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const expenses = {};
      EXPENSE_FIELDS.forEach(({ key }) => { expenses[key] = Number(form[key]) || 0; });
      const { data } = await axios.post('/api/expenses/ai-plan', {
        salary: Number(form.salary),
        expenses,
      });
      setPlan(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Plan generate nahi hua');
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" /> Apni Details Bharo
          </h3>

          <div>
            <label className="label">Monthly Salary (₹)</label>
            <input className="input text-lg font-semibold" type="number" placeholder="50000"
              value={form.salary} onChange={set('salary')} required min={1} />
          </div>

          <div className="border-t border-gray-700 pt-4">
            <p className="text-gray-400 text-sm mb-3">Monthly Expenses:</p>
            <div className="grid grid-cols-2 gap-3">
              {EXPENSE_FIELDS.map(({ key, label, placeholder, emoji }) => (
                <div key={key}>
                  <label className="label">{emoji} {label}</label>
                  <input className="input" type="number" placeholder={placeholder}
                    value={form[key]} onChange={set(key)} min={0} />
                </div>
              ))}
            </div>
          </div>

          {/* Live Preview */}
          {form.salary > 0 && (
            <div className="bg-gray-800 rounded-xl p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total Expenses:</span>
                <span className="text-red-400 font-medium">₹{totalExpenses.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Savings:</span>
                <span className={`font-bold ${savings >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  ₹{savings.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <button onClick={handleSubmit} className="btn-primary w-full flex items-center justify-center gap-2"
            disabled={loading || !form.salary}>
            <Sparkles className="w-4 h-4" />
            {loading ? 'AI Plan Bana Raha Hai...' : 'AI Financial Plan Banao'}
          </button>
        </div>

        {/* Plan Output */}
        {plan ? (
          <div className="space-y-4">
            {/* Health Score */}
            <div className="card flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Financial Health Score</p>
                <p className={`text-3xl font-bold ${HEALTH_COLOR[plan.healthLabel] || 'text-white'}`}>
                  {plan.healthScore}/10
                </p>
                <p className={`text-sm font-medium ${HEALTH_COLOR[plan.healthLabel]}`}>{plan.healthLabel}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-sm">Monthly Savings</p>
                <p className="text-2xl font-bold text-emerald-400">₹{plan.totalSavings?.toLocaleString()}</p>
                <p className="text-gray-500 text-xs">{plan.savingsPercentage}% of salary</p>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="card">
              <h4 className="font-medium text-white mb-3">Expense Breakdown</h4>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={plan.chartData?.filter(d => d.amount > 0)} dataKey="amount"
                    nameKey="name" cx="50%" cy="50%" outerRadius={80}
                    label={({ name, percentage }) => `${name} ${percentage}%`} labelLine={false}>
                    {plan.chartData?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `₹${v.toLocaleString()}`}
                    contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="card flex items-center justify-center min-h-[300px]">
            <div className="text-center">
              <Sparkles className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500">Form bharo aur AI se apna financial plan pao</p>
            </div>
          </div>
        )}
      </div>

      {/* Full Plan Details */}
      {plan && (
        <div className="space-y-4">
          {/* Bar Chart - Expense vs Savings */}
          <div className="card">
            <h4 className="font-medium text-white mb-3">Monthly Breakdown</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                { name: 'Must Spend', amount: plan.monthlyBreakdown?.mustSpend, fill: '#ef4444' },
                { name: 'Want Spend', amount: plan.monthlyBreakdown?.wantSpend, fill: '#f59e0b' },
                { name: 'Savings', amount: plan.monthlyBreakdown?.savings, fill: '#10b981' },
              ]}>
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip formatter={(v) => `₹${v?.toLocaleString()}`}
                  contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {[{ fill: '#ef4444' }, { fill: '#f59e0b' }, { fill: '#10b981' }].map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* AI Advice */}
          <div className="card bg-blue-500/10 border-blue-500/30">
            <div className="flex gap-3">
              <Lightbulb className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-medium mb-1">AI ki Salah</p>
                <p className="text-gray-300 text-sm leading-relaxed">{plan.topAdvice}</p>
              </div>
            </div>
          </div>

          {/* Suggestions */}
          {plan.suggestions?.length > 0 && (
            <div className="card">
              <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" /> Kahan Cut Karo
              </h4>
              <div className="space-y-2">
                {plan.suggestions.map((s, i) => (
                  <div key={i} className="p-3 bg-gray-800 rounded-xl">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white text-sm font-medium">{s.category}</span>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-red-400">₹{s.currentAmount?.toLocaleString()}</span>
                        <span className="text-gray-500">→</span>
                        <span className="text-emerald-400">₹{s.suggestedAmount?.toLocaleString()}</span>
                        <span className="text-yellow-400 font-semibold">(-₹{s.saving?.toLocaleString()})</span>
                      </div>
                    </div>
                    <p className="text-gray-500 text-xs">{s.tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Yearly Projection */}
          <div className="card">
            <h4 className="font-medium text-white mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Yearly Projection
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Current Yearly Savings', value: plan.yearlyProjection?.currentSavings, color: 'text-blue-400' },
                { label: 'If Advice Follow Karo', value: plan.yearlyProjection?.ifFollowAdvice, color: 'text-emerald-400' },
                { label: 'FD mein rakho toh (7%)', value: plan.yearlyProjection?.fdReturns, color: 'text-yellow-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-800 rounded-xl p-3 text-center">
                  <p className="text-gray-400 text-xs mb-1">{label}</p>
                  <p className={`text-xl font-bold ${color}`}>₹{value?.toLocaleString()}</p>
                </div>
              ))}
            </div>
            <p className="text-gray-400 text-sm mt-3 text-center">
              🛡️ Emergency Fund: {plan.emergencyFundStatus}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ExpenseTracker() {
  const [activeTab, setActiveTab] = useState('manual');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Expense Tracker</h2>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit gap-1">
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'manual' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Plus className="w-4 h-4" /> Manual Tracker
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'ai' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" /> AI Financial Planner
        </button>
      </div>

      {activeTab === 'manual' ? <ManualTracker /> : <AIPlanner />}
    </div>
  );
}
