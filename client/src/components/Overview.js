import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Target, Edit2 } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#6b7280'];

const StatCard = ({ label, value, icon: Icon, color, sub, onEdit }) => (
  <div className="card flex items-center gap-4 relative group">
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-2xl font-bold text-white">₹{Number(value || 0).toLocaleString()}</p>
      {sub && <p className={`text-xs mt-0.5 ${sub.color}`}>{sub.text}</p>}
    </div>
    {onEdit && (
      <button onClick={onEdit} className="absolute top-3 right-3 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
        <Edit2 className="w-4 h-4" />
      </button>
    )}
  </div>
);

export default function Overview() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editIncome, setEditIncome] = useState(false);
  const [newIncome, setNewIncome] = useState('');

  useEffect(() => {
    axios.get('/api/expenses/summary')
      .then(({ data }) => setSummary(data))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdateIncome = async () => {
    if (!newIncome || isNaN(newIncome)) return;
    try {
      await axios.put('/api/auth/income', { monthlyIncome: Number(newIncome) });
      toast.success('Income update ho gayi! 🎉');
      setEditIncome(false);
      // Refresh summary directly
      const { data } = await axios.get('/api/expenses/summary');
      setSummary(data);
    } catch (err) {
      toast.error('Update nahi hua. Thodi der baad try karo.');
    }
  };

  if (loading) return <div className="text-center text-gray-400 py-20">Loading overview...</div>;
  if (!summary) return null;

  const pieData = Object.entries(summary.byCategory || {}).map(([name, value]) => ({ name, value }));
  const barData = summary.budgetSuggestions?.map((b) => ({
    category: b.category.slice(0, 4),
    Suggested: b.suggested,
    Actual: b.actual,
  }));

  const savingsPct = summary.monthlyIncome > 0
    ? Math.round((summary.savings / summary.monthlyIncome) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">This Month's Overview</h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Monthly Income" 
          value={summary.monthlyIncome} 
          icon={Wallet} 
          color="bg-blue-600" 
          onEdit={() => { setNewIncome(summary.monthlyIncome); setEditIncome(true); }}
        />
        <StatCard label="Total Expenses" value={summary.totalExpenses} icon={TrendingDown} color="bg-red-500"
          sub={{ text: `${Math.round((summary.totalExpenses / summary.monthlyIncome) * 100) || 0}% of income`, color: 'text-red-400' }} />
        <StatCard label="Savings" value={summary.savings} icon={TrendingUp} color={summary.savings >= 0 ? 'bg-emerald-600' : 'bg-red-500'}
          sub={{ text: `${savingsPct}% saved`, color: savingsPct >= 20 ? 'text-emerald-400' : 'text-yellow-400' }} />
        <StatCard label="Surplus" value={summary.surplus} icon={Target} color="bg-purple-600" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="card">
          <h3 className="font-semibold text-white mb-4">Spending by Category</h3>
          {pieData.length === 0 ? (
            <p className="text-gray-500 text-center py-10">No expenses this month</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar Chart */}
        <div className="card">
          <h3 className="font-semibold text-white mb-4">Budget vs Actual</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <XAxis dataKey="category" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
              <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
              <Bar dataKey="Suggested" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Actual" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Budget Suggestions */}
      <div className="card">
        <h3 className="font-semibold text-white mb-4">AI Budget Suggestions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {summary.budgetSuggestions?.map((b) => (
            <div key={b.category} className={`p-3 rounded-xl border ${b.status === 'over' ? 'border-red-500/30 bg-red-500/10' : 'border-emerald-500/30 bg-emerald-500/10'}`}>
              <p className="text-sm font-medium text-white">{b.category}</p>
              <p className="text-xs text-gray-400 mt-1">Budget: ₹{b.suggested.toLocaleString()}</p>
              <p className="text-xs text-gray-400">Spent: ₹{b.actual.toLocaleString()}</p>
              <span className={`text-xs font-semibold mt-1 inline-block ${b.status === 'over' ? 'text-red-400' : 'text-emerald-400'}`}>
                {b.status === 'over' ? '⚠ Over budget' : '✓ On track'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Income Modal */}
      {editIncome && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-white mb-4">Edit Monthly Income</h3>
            <input className="input mb-4" type="number" placeholder="Enter new income" value={newIncome} onChange={(e) => setNewIncome(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={() => setEditIncome(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleUpdateIncome} className="btn-primary flex-1">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
