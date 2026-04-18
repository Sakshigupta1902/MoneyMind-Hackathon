import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Star, Flame, Trophy, Gift, CheckCircle, XCircle, Coins } from 'lucide-react';

const CASHBACK_TIERS = [
  { points: 50, cashback: 5 },
  { points: 100, cashback: 10 },
  { points: 250, cashback: 25 },
  { points: 500, cashback: 50 },
];

export default function RewardWallet() {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);

  const fetchWallet = async () => {
    try {
      const { data } = await axios.get('/api/reward');
      setWallet(data);
    } catch {
      toast.error('Wallet load nahi hua');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWallet(); }, []);

  const handleRedeem = async (points) => {
    setRedeeming(true);
    try {
      const { data } = await axios.post('/api/reward/redeem', { points });
      toast.success(data.message);
      fetchWallet();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Redeem nahi hua');
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) return <div className="text-center text-gray-400 py-20">Wallet load ho raha hai...</div>;
  if (!wallet) return null;

  const progressToNext = wallet.totalPoints % 50;
  const progressPct = (progressToNext / 50) * 100;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <Gift className="w-6 h-6 text-yellow-400" /> Reward Wallet
      </h2>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Points', value: wallet.totalPoints, icon: Star, color: 'bg-yellow-500', sub: `₹${wallet.cashbackValue} cashback value` },
          { label: 'Current Streak', value: `${wallet.currentStreak} din`, icon: Flame, color: 'bg-orange-500', sub: wallet.currentStreak >= 7 ? '🔥 On fire!' : 'Roz padho streak badhao' },
          { label: 'Lessons Done', value: wallet.lessonsCompleted, icon: Trophy, color: 'bg-purple-500', sub: `${wallet.correctAnswers} sahi jawab` },
          { label: 'Lifetime Points', value: wallet.lifetimePoints, icon: Coins, color: 'bg-blue-500', sub: 'Kabhi expire nahi hote' },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="card flex items-center gap-3">
            <div className={`${color} p-2.5 rounded-xl flex-shrink-0`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-xs">{label}</p>
              <p className="text-white font-bold text-lg">{value}</p>
              <p className="text-gray-500 text-xs">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Points Progress Bar */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <p className="text-white font-medium text-sm">Agla cashback milestone</p>
          <p className="text-gray-400 text-sm">{progressToNext}/50 points</p>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-yellow-500 to-orange-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-gray-500 text-xs mt-2">{50 - progressToNext} aur points chahiye ₹5 cashback ke liye</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Redeem Section */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Gift className="w-5 h-5 text-yellow-400" /> Points Redeem Karo
          </h3>
          <p className="text-gray-400 text-sm">Aapke paas <span className="text-yellow-400 font-bold">{wallet.totalPoints} points</span> hain</p>

          <div className="space-y-2">
            {CASHBACK_TIERS.map(({ points, cashback }) => {
              const canAfford = wallet.totalPoints >= points;
              return (
                <div key={points} className={`flex items-center justify-between p-3 rounded-xl border ${canAfford ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-gray-700 opacity-50'}`}>
                  <div>
                    <p className="text-white text-sm font-medium">{points} Points</p>
                    <p className="text-gray-400 text-xs">= ₹{cashback} Cashback</p>
                  </div>
                  <button
                    onClick={() => handleRedeem(points)}
                    disabled={!canAfford || redeeming}
                    className={`text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors ${
                      canAfford ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Redeem
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Badges */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-purple-400" /> Badges
          </h3>
          {wallet.badges.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 text-sm">Abhi koi badge nahi hai</p>
              <p className="text-gray-600 text-xs mt-1">Lessons complete karo badges kamao!</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {wallet.badges.map((badge) => (
                <span key={badge} className="bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm px-3 py-1.5 rounded-full">
                  {badge}
                </span>
              ))}
            </div>
          )}

          {/* Locked badges preview */}
          <div>
            <p className="text-gray-500 text-xs mb-2">Unlock karne ke liye:</p>
            <div className="space-y-1">
              {[
                { badge: '🎓 First Lesson', condition: 'Pehla lesson complete karo', done: wallet.lessonsCompleted >= 1 },
                { badge: '🧠 Quiz Master', condition: '10 sahi jawab do', done: wallet.correctAnswers >= 10 },
                { badge: '🔥 Week Streak', condition: '7 din ki streak banao', done: wallet.currentStreak >= 7 },
                { badge: '💎 Month Streak', condition: '30 din ki streak banao', done: wallet.currentStreak >= 30 },
                { badge: '🏆 500 Club', condition: '500 lifetime points kamao', done: wallet.lifetimePoints >= 500 },
              ].map(({ badge, condition, done }) => (
                <div key={badge} className="flex items-center gap-2 text-xs">
                  {done
                    ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    : <XCircle className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />}
                  <span className={done ? 'text-emerald-400' : 'text-gray-500'}>{badge} — {condition}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 7 Day Activity */}
      <div className="card">
        <h3 className="font-semibold text-white mb-4">Last 7 Days Activity</h3>
        <div className="grid grid-cols-7 gap-2">
          {wallet.last7Days.map((day) => (
            <div key={day.date} className="text-center">
              <div className={`w-full aspect-square rounded-lg flex items-center justify-center mb-1 ${
                day.completed
                  ? day.correct ? 'bg-emerald-500/30 border border-emerald-500/50' : 'bg-red-500/20 border border-red-500/30'
                  : 'bg-gray-800 border border-gray-700'
              }`}>
                {day.completed
                  ? day.correct ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />
                  : <span className="text-gray-600 text-xs">—</span>}
              </div>
              <p className="text-gray-500 text-xs">
                {new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 2)}
              </p>
              {day.points > 0 && <p className="text-yellow-500 text-xs">+{day.points}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Redeem History */}
      {wallet.redeemHistory.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-white mb-4">Redeem History</h3>
          <div className="space-y-2">
            {wallet.redeemHistory.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-800 rounded-xl">
                <div>
                  <p className="text-white text-sm">{r.pointsUsed} points redeem kiye</p>
                  <p className="text-gray-500 text-xs">{new Date(r.redeemedAt).toLocaleDateString('en-IN')}</p>
                </div>
                <span className="text-emerald-400 font-bold">₹{r.cashbackValue}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
