import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend, LineChart, Line, CartesianGrid
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet, AlertCircle, Save } from 'lucide-react';

const ASSETS = [
  { key: 'savings',      label: 'Savings / Bank Balance', emoji: '🏦' },
  { key: 'fixedDeposit', label: 'Fixed Deposits (FD)',    emoji: '📋' },
  { key: 'gold',         label: 'Gold',                   emoji: '🥇' },
  { key: 'mutualFunds',  label: 'Mutual Funds',           emoji: '📈' },
  { key: 'stocks',       label: 'Stocks',                 emoji: '📊' },
  { key: 'ppf',          label: 'PPF / PF',               emoji: '🏛️' },
  { key: 'realEstate',   label: 'Real Estate',            emoji: '🏠' },
  { key: 'other',        label: 'Other Assets',           emoji: '💼' },
];

const LIABILITIES = [
  { key: 'homeLoan',     label: 'Home Loan',              emoji: '🏠' },
  { key: 'carLoan',      label: 'Car Loan',               emoji: '🚗' },
  { key: 'personalLoan', label: 'Personal Loan',          emoji: '💳' },
  { key: 'creditCard',   label: 'Credit Card Dues',       emoji: '💳' },
  { key: 'education',    label: 'Education Loan',         emoji: '📚' },
  { key: 'other',        label: 'Other Liabilities',      emoji: '📦' },
];

const initAssets      = Object.fromEntries(ASSETS.map(a => [a.key, '']));
const initLiabilities = Object.fromEntries(LIABILITIES.map(l => [l.key, '']));

export default function NetWorthTracker() {
  const [assets,      setAssets]      = useState(initAssets);
  const [liabilities, setLiabilities] = useState(initLiabilities);
  const [current,     setCurrent]     = useState(null);
  const [history,     setHistory]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [activeTab,   setActiveTab]   = useState('overview');

  const fetchData = async () => {
    try {
      const [curRes, histRes] = await Promise.all([
        axios.get('/api/networth/current'),
        axios.get('/api/networth/history'),
      ]);
      if (curRes.data.hasData) {
        setCurrent(curRes.data);
        setAssets(Object.fromEntries(
          Object.entries(curRes.data.assets).map(([k, v]) => [k, v || ''])
        ));
        setLiabilities(Object.fromEntries(
          Object.entries(curRes.data.liabilities).map(([k, v]) => [k, v || ''])
        ));
      }
      setHistory(histRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const cleanAssets      = Object.fromEntries(Object.entries(assets).map(([k, v]) => [k, Number(v) || 0]));
      const cleanLiabilities = Object.fromEntries(Object.entries(liabilities).map(([k, v]) => [k, Number(v) || 0]));
      const { data } = await axios.post('/api/networth', { assets: cleanAssets, liabilities: cleanLiabilities });
      setCurrent(data);
      toast.success('Net Worth save ho gaya! 💰');
      fetchData();
      setActiveTab('overview');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save nahi hua');
    } finally {
      setSaving(false);
    }
  };

  const totalAssets      = Object.values(assets).reduce((s, v) => s + (Number(v) || 0), 0);
  const totalLiabilities = Object.values(liabilities).reduce((s, v) => s + (Number(v) || 0), 0);
  const netWorth         = totalAssets - totalLiabilities;

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <Wallet className="w-6 h-6 text-blue-400" /> Net Worth Tracker
      </h2>

      {/* Tabs */}
      <div className="flex bg-gray-900 border border-gray-800 rounded-xl p-1 gap-1 w-fit">
        {[
          { val: 'overview', label: '📊 Overview'  },
          { val: 'update',   label: '✏️ Update'    },
          { val: 'history',  label: '📈 History'   },
        ].map(({ val, label }) => (
          <button key={val} onClick={() => setActiveTab(val)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === val ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {!current?.hasData ? (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <Wallet className="w-14 h-14 text-gray-700 mb-3" />
              <p className="text-gray-400 font-medium">Net Worth abhi calculate nahi hua</p>
              <p className="text-gray-600 text-sm mt-1">Apne assets aur liabilities enter karo</p>
              <button onClick={() => setActiveTab('update')} className="btn-primary mt-4">
                Abhi Calculate Karo
              </button>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card bg-emerald-500/10 border-emerald-500/30 text-center">
                  <p className="text-gray-400 text-sm">Total Assets</p>
                  <p className="text-emerald-400 font-bold text-3xl mt-1">₹{current.totalAssets?.toLocaleString()}</p>
                  <TrendingUp className="w-5 h-5 text-emerald-400 mx-auto mt-2" />
                </div>
                <div className="card bg-red-500/10 border-red-500/30 text-center">
                  <p className="text-gray-400 text-sm">Total Liabilities</p>
                  <p className="text-red-400 font-bold text-3xl mt-1">₹{current.totalLiabilities?.toLocaleString()}</p>
                  <TrendingDown className="w-5 h-5 text-red-400 mx-auto mt-2" />
                </div>
                <div className={`card text-center border-2 ${netWorth >= 0 ? 'bg-blue-500/10 border-blue-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                  <p className="text-gray-400 text-sm">Net Worth</p>
                  <p className={`font-bold text-3xl mt-1 ${current.netWorth >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                    ₹{current.netWorth?.toLocaleString()}
                  </p>
                  <p className="text-gray-500 text-xs mt-2">Assets - Liabilities</p>
                </div>
              </div>

              {/* Assets Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="font-semibold text-white mb-4">Assets Breakdown</h3>
                  <div className="space-y-2">
                    {ASSETS.filter(a => current.assets?.[a.key] > 0).map((a) => {
                      const val = current.assets?.[a.key] || 0;
                      const pct = current.totalAssets > 0 ? Math.round((val / current.totalAssets) * 100) : 0;
                      return (
                        <div key={a.key}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-300">{a.emoji} {a.label}</span>
                            <span className="text-white font-medium">₹{val.toLocaleString()} <span className="text-gray-500">({pct}%)</span></span>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-1.5">
                            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                    {ASSETS.every(a => !current.assets?.[a.key]) && (
                      <p className="text-gray-500 text-sm text-center py-4">Koi asset enter nahi kiya</p>
                    )}
                  </div>
                </div>

                <div className="card">
                  <h3 className="font-semibold text-white mb-4">Liabilities Breakdown</h3>
                  <div className="space-y-2">
                    {LIABILITIES.filter(l => current.liabilities?.[l.key] > 0).map((l) => {
                      const val = current.liabilities?.[l.key] || 0;
                      const pct = current.totalLiabilities > 0 ? Math.round((val / current.totalLiabilities) * 100) : 0;
                      return (
                        <div key={l.key}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-300">{l.emoji} {l.label}</span>
                            <span className="text-white font-medium">₹{val.toLocaleString()} <span className="text-gray-500">({pct}%)</span></span>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-1.5">
                            <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                    {LIABILITIES.every(l => !current.liabilities?.[l.key]) && (
                      <p className="text-gray-500 text-sm text-center py-4">Koi liability nahi — Great! 🎉</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Health Indicator */}
              {current.totalLiabilities > 0 && (
                <div className={`card border ${current.netWorth >= 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                  <div className="flex items-center gap-3">
                    <AlertCircle className={`w-5 h-5 flex-shrink-0 ${current.netWorth >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
                    <div>
                      <p className="text-white font-medium text-sm">
                        {current.netWorth >= 0
                          ? '✅ Positive Net Worth — Tumhare assets liabilities se zyada hain!'
                          : '⚠️ Negative Net Worth — Liabilities assets se zyada hain. Debt reduce karo.'}
                      </p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        Debt-to-Asset Ratio: {current.totalAssets > 0
                          ? Math.round((current.totalLiabilities / current.totalAssets) * 100)
                          : 0}%
                        {' '}(40% se kam hona chahiye)
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Update Tab */}
      {activeTab === 'update' && (
        <div className="space-y-6">
          {/* Live Preview */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
              <p className="text-gray-400 text-xs">Assets</p>
              <p className="text-emerald-400 font-bold">₹{totalAssets.toLocaleString()}</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
              <p className="text-gray-400 text-xs">Liabilities</p>
              <p className="text-red-400 font-bold">₹{totalLiabilities.toLocaleString()}</p>
            </div>
            <div className={`border rounded-xl p-3 text-center ${netWorth >= 0 ? 'bg-blue-500/10 border-blue-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
              <p className="text-gray-400 text-xs">Net Worth</p>
              <p className={`font-bold ${netWorth >= 0 ? 'text-blue-400' : 'text-red-400'}`}>₹{netWorth.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assets Form */}
            <div className="card">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" /> Assets (Jo tumhare paas hai)
              </h3>
              <div className="space-y-3">
                {ASSETS.map(({ key, label, emoji }) => (
                  <div key={key}>
                    <label className="label">{emoji} {label}</label>
                    <input className="input" type="number" placeholder="0" min={0}
                      value={assets[key]}
                      onChange={(e) => setAssets(a => ({ ...a, [key]: e.target.value }))} />
                  </div>
                ))}
              </div>
            </div>

            {/* Liabilities Form */}
            <div className="card">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-400" /> Liabilities (Jo tumhara debt hai)
              </h3>
              <div className="space-y-3">
                {LIABILITIES.map(({ key, label, emoji }) => (
                  <div key={key}>
                    <label className="label">{emoji} {label}</label>
                    <input className="input" type="number" placeholder="0" min={0}
                      value={liabilities[key]}
                      onChange={(e) => setLiabilities(l => ({ ...l, [key]: e.target.value }))} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button onClick={handleSave} disabled={saving}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3">
            <Save className="w-5 h-5" />
            {saving ? 'Save Ho Raha Hai...' : '💾 Net Worth Save Karo'}
          </button>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {history.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <p className="text-gray-400">Abhi sirf ek mahine ka data hai</p>
              <p className="text-gray-600 text-sm mt-1">Har mahine update karo — trend dikhega</p>
            </div>
          ) : (
            <>
              {/* Bar Chart */}
              <div className="card">
                <h3 className="font-semibold text-white mb-4">Assets vs Liabilities</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={history} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => `₹${v.toLocaleString()}`}
                      contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                    <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
                    <Bar dataKey="totalAssets"      name="Assets"      fill="#10b981" radius={[4,4,0,0]} />
                    <Bar dataKey="totalLiabilities" name="Liabilities" fill="#ef4444" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Net Worth Line Chart */}
              <div className="card">
                <h3 className="font-semibold text-white mb-4">Net Worth Trend</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={history} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => `₹${v.toLocaleString()}`}
                      contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="netWorth" name="Net Worth"
                      stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
