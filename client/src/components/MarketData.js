import { useEffect, useState } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, RefreshCw, Info, Wifi, WifiOff, BookOpen } from 'lucide-react';

// Live badge
const LiveBadge = ({ isLive }) => (
  <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
    isLive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'
  }`}>
    {isLive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
    {isLive ? 'Live' : 'Cached'}
  </span>
);

const SectionTitle = ({ emoji, title, lastUpdated, isLive, onRefresh, loading }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-3">
      <h3 className="font-semibold text-white flex items-center gap-2">
        <span className="text-xl">{emoji}</span> {title}
      </h3>
      {isLive !== undefined && <LiveBadge isLive={isLive} />}
    </div>
    <div className="flex items-center gap-3">
      {lastUpdated && <span className="text-gray-500 text-xs">{lastUpdated}</span>}
      {onRefresh && (
        <button onClick={onRefresh} disabled={loading}
          className="text-gray-400 hover:text-white transition-colors disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  </div>
);

const Skeleton = ({ rows = 3 }) => (
  <div className="space-y-2">
    {Array(rows).fill(0).map((_, i) => (
      <div key={i} className="h-14 bg-gray-800 rounded-xl animate-pulse" />
    ))}
  </div>
);

export default function MarketData() {
  const [fdData,      setFdData]      = useState(null);
  const [goldData,    setGoldData]    = useState(null);
  const [mfData,      setMfData]      = useState(null);
  const [currency,    setCurrency]    = useState(null);
  const [govtSchemes, setGovtSchemes] = useState(null);
  const [loading, setLoading] = useState({ fd: true, gold: true, mf: true, currency: true, govt: true });

  const setLoad = (key, val) => setLoading(l => ({ ...l, [key]: val }));

  const fetchSection = async (key, url, setter) => {
    setLoad(key, true);
    try {
      const { data } = await axios.get(url);
      setter(data);
    } catch { /* silent fail */ }
    finally { setLoad(key, false); }
  };

  const fetchAll = () => {
    fetchSection('fd',       '/api/market/fd-rates',     setFdData);
    fetchSection('gold',     '/api/market/gold',         setGoldData);
    fetchSection('mf',       '/api/market/mutual-funds', setMfData);
    fetchSection('currency', '/api/market/currency',     setCurrency);
    fetchSection('govt',     '/api/market/govt-schemes', setGovtSchemes);
  };

  useEffect(() => { fetchAll(); }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">📊 Live Market Data</h2>
          <p className="text-gray-500 text-sm mt-1">Real financial data — Gold, Mutual Funds, Currency, FD Rates</p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/glossary" className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-sm px-4 py-2.5 rounded-lg transition-colors font-medium">
            <BookOpen className="w-4 h-4" /> Asaan Bhasha (Terms)
          </a>
          <button onClick={fetchAll} className="flex items-center gap-2 btn-secondary text-sm py-2.5">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Currency Rate — Live */}
      <div className="card">
        <SectionTitle emoji="💱" title="Currency Rates" isLive={currency?.isLive}
          lastUpdated={currency?.isLive ? 'Live' : 'Fallback'}
          onRefresh={() => fetchSection('currency', '/api/market/currency', setCurrency)}
          loading={loading.currency} />
        {loading.currency ? <Skeleton rows={1} /> : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: '1 USD', value: `₹${currency?.usdInr}`, flag: '🇺🇸' },
              { label: '1 EUR', value: `₹${currency?.eurInr}`, flag: '🇪🇺' },
              { label: '1 GBP', value: `₹${currency?.gbpInr}`, flag: '🇬🇧' },
              { label: '1 JPY', value: `₹${currency?.jpyInr}`, flag: '🇯🇵' },
            ].map(({ label, value, flag }) => (
              <div key={label} className="bg-gray-800 rounded-xl p-4 text-center">
                <p className="text-2xl mb-1">{flag}</p>
                <p className="text-white font-bold text-lg">{value}</p>
                <p className="text-gray-500 text-xs">{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gold Price — Live */}
      <div className="card">
        <SectionTitle emoji="🥇" title="Gold Price" isLive={goldData?.isLive}
          lastUpdated={goldData?.lastUpdated}
          onRefresh={() => fetchSection('gold', '/api/market/gold', setGoldData)}
          loading={loading.gold} />
        {loading.gold ? <Skeleton rows={1} /> : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center lg:col-span-1">
                <p className="text-gray-400 text-xs mb-1">10g Gold (INR)</p>
                <p className="text-yellow-400 font-bold text-3xl">₹{goldData?.per10gINR?.toLocaleString()}</p>
                <p className="text-gray-500 text-xs mt-1">Based on live international price</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 text-center">
                <p className="text-gray-400 text-xs mb-1">1g Gold (INR)</p>
                <p className="text-yellow-300 font-bold text-2xl">₹{goldData?.per1gINR?.toLocaleString()}</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 text-center">
                <p className="text-gray-400 text-xs mb-1">Gold (USD/oz)</p>
                <p className="text-white font-bold text-2xl">${goldData?.priceUSD}</p>
                <p className="text-gray-500 text-xs mt-1">USD/INR: ₹{goldData?.usdToInr}</p>
              </div>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
              <p className="text-yellow-300 text-sm">💡 {goldData?.tip}</p>
            </div>
          </div>
        )}
      </div>

      {/* Mutual Funds — Live NAV */}
      <div className="card">
        <SectionTitle emoji="📈" title="Top Mutual Funds — Live NAV" isLive={mfData?.isLive}
          lastUpdated={mfData?.lastUpdated}
          onRefresh={() => fetchSection('mf', '/api/market/mutual-funds', setMfData)}
          loading={loading.mf} />
        {loading.mf ? <Skeleton rows={5} /> : (
          <div className="space-y-3">
            {mfData?.funds?.map((fund) => (
              <div key={fund.schemeCode} className="flex items-center justify-between p-3 bg-gray-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-1.5 h-12 rounded-full flex-shrink-0 ${fund.isPositive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <div>
                    <p className="text-white text-sm font-medium">{fund.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">{fund.category}</span>
                      {fund.date && <span className="text-gray-600 text-xs">NAV date: {fund.date}</span>}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-lg">₹{fund.nav}</p>
                  <div className={`flex items-center justify-end gap-1 text-sm font-medium ${fund.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {fund.isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {fund.change > 0 ? '+' : ''}{fund.change}%
                  </div>
                </div>
              </div>
            ))}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
              <p className="text-blue-300 text-sm">💡 {mfData?.tip}</p>
            </div>
          </div>
        )}
      </div>

      {/* FD Rates — Accurate */}
      <div className="card">
        <SectionTitle emoji="🏦" title="Fixed Deposit Rates" isLive={false}
          lastUpdated={fdData?.lastUpdated} />
        {loading.fd ? <Skeleton rows={4} /> : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                <p className="text-gray-400 text-xs">Best 1 Year Rate</p>
                <p className="text-emerald-400 font-bold text-2xl">{fdData?.best1yr?.rate}%</p>
                <p className="text-gray-300 text-sm font-medium">{fdData?.best1yr?.bank}</p>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                <p className="text-gray-400 text-xs">Best 5 Year Rate</p>
                <p className="text-blue-400 font-bold text-2xl">{fdData?.best5yr?.rate}%</p>
                <p className="text-gray-300 text-sm font-medium">{fdData?.best5yr?.bank}</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-xs border-b border-gray-800">
                    <th className="text-left py-2 pr-4">Bank</th>
                    <th className="text-center py-2 px-2">1 Yr</th>
                    <th className="text-center py-2 px-2">2 Yr</th>
                    <th className="text-center py-2 px-2">3 Yr</th>
                    <th className="text-center py-2 px-2">5 Yr</th>
                    <th className="text-center py-2 px-2">Senior</th>
                    <th className="text-center py-2 px-2">Min</th>
                  </tr>
                </thead>
                <tbody>
                  {fdData?.rates?.map((bank) => (
                    <tr key={bank.bank} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="py-3 pr-4 text-white font-medium">{bank.bank}</td>
                      {['1yr','2yr','3yr','5yr'].map((t) => (
                        <td key={t} className="text-center py-3 px-2">
                          <span className={`font-semibold ${
                            bank.rates[t] >= 7.0 ? 'text-emerald-400' :
                            bank.rates[t] >= 6.8 ? 'text-blue-400' : 'text-gray-300'
                          }`}>{bank.rates[t]}%</span>
                        </td>
                      ))}
                      <td className="text-center py-3 px-2 text-yellow-400 text-xs">{bank.seniorCitizen}</td>
                      <td className="text-center py-3 px-2 text-gray-400 text-xs">{bank.minAmount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-600 text-xs flex items-center gap-1">
              <Info className="w-3 h-3" /> {fdData?.note}
            </p>
          </div>
        )}
      </div>

      {/* Government Schemes — Accurate */}
      <div className="card">
        <SectionTitle emoji="🏛️" title="Government Savings Schemes" isLive={false}
          lastUpdated={`Q1 2025`} />
        {loading.govt ? <Skeleton rows={3} /> : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {govtSchemes?.schemes?.map((s) => (
                <div key={s.name} className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{s.emoji}</span>
                      <span className="text-white font-bold">{s.name}</span>
                    </div>
                    <span className="text-emerald-400 font-bold text-lg">{s.rate}%</span>
                  </div>
                  <p className="text-gray-400 text-xs mb-2">{s.fullName}</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tenure:</span>
                      <span className="text-gray-300">{s.tenure}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Min Amount:</span>
                      <span className="text-gray-300">{s.minAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Max Amount:</span>
                      <span className="text-gray-300">{s.maxAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tax Benefit:</span>
                      <span className="text-blue-400">{s.taxBenefit}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-gray-600 text-xs flex items-center gap-1">
              <Info className="w-3 h-3" /> {govtSchemes?.note}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
