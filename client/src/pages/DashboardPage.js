import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { TrendingUp, LayoutDashboard, Receipt, PiggyBank, BookOpen, Gift, LogOut, Target, BarChart2, Wallet, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import Overview        from '../components/Overview';
import ExpenseTracker  from '../components/ExpenseTracker';
import InvestmentGuide from '../components/InvestmentGuide';
import DailyLesson     from '../components/DailyLesson';
import RewardWallet    from '../components/RewardWallet';
import BudgetTarget    from '../components/BudgetTarget';
import NotificationBell from '../components/NotificationBell';
import SavingsGoal     from '../components/SavingsGoal';
import MarketData      from '../components/MarketData';
import NetWorthTracker from '../components/NetWorthTracker';
import ProfilePage     from '../components/ProfilePage';
import FinanceGlossary from '../components/FinanceGlossary';

const getNav = (isEng) => [
  { path: '/',         label: 'Overview',                      icon: LayoutDashboard },
  { path: '/expenses', label: isEng ? 'Expenses'  : 'Kharcha', icon: Receipt         },
  { path: '/budget',   label: 'Budget',                        icon: Target          },
  { path: '/goals',    label: isEng ? 'Goals'     : 'Lakshya', icon: PiggyBank       },
  { path: '/networth', label: 'Net Worth',                     icon: Wallet          },
  { path: '/market',   label: 'Market',                        icon: BarChart2       },
  { path: '/invest',   label: 'Invest',                        icon: TrendingUp      },
  { path: '/learn',    label: isEng ? 'Learn'     : 'Seekho',  icon: BookOpen        },
  { path: '/rewards',  label: 'Rewards',                       icon: Gift            },
];

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [points, setPoints] = useState(0);
  
  const isEng = language === 'english';
  const navLinks = getNav(isEng);

  useEffect(() => {
    axios.get('/api/reward')
      .then(({ data }) => setPoints(data.totalPoints))
      .catch(() => {});
  }, [location.pathname]);

  // Avatar initials
  const initials    = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const avatarColors = ['bg-blue-600','bg-purple-600','bg-emerald-600','bg-orange-600','bg-pink-600'];
  const avatarColor  = avatarColors[(user?.name?.charCodeAt(0) || 0) % avatarColors.length];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="bg-blue-600 p-2 rounded-lg">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-white text-lg">MoneyMind</span>
        </div>

        {/* Nav Links — scrollable on small screens */}
        <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide mx-2">
          {navLinks.map(({ path, label, icon: Icon }) => (
            <button key={path} onClick={() => navigate(path)}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                location.pathname === path
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Points Badge */}
          <button onClick={() => navigate('/rewards')}
            className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/30 px-2.5 py-1.5 rounded-full hover:bg-yellow-500/20 transition-colors">
            <span className="text-yellow-400 text-xs">⭐</span>
            <span className="text-yellow-400 font-bold text-xs">{points}</span>
          </button>

          {/* Language Toggle */}
          <button onClick={toggleLanguage}
            className="flex items-center justify-center w-8 h-8 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors text-white font-bold text-xs flex-shrink-0"
            title="Toggle Language">
            {language === 'english' ? 'EN' : 'HI'}
          </button>

          {/* Notification Bell */}
          <NotificationBell />

          {/* Avatar — click to go to profile */}
          <button onClick={() => navigate('/profile')}
            className={`w-9 h-9 rounded-xl ${avatarColor} flex items-center justify-center hover:opacity-80 transition-opacity flex-shrink-0`}
            title={user?.name}>
            <span className="text-white font-bold text-sm">{initials}</span>
          </button>

          {/* Logout */}
          <button onClick={logout}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Page Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <Routes>
          <Route path="/"         element={<Overview />}        />
          <Route path="/expenses" element={<ExpenseTracker />}  />
          <Route path="/budget"   element={<BudgetTarget />}    />
          <Route path="/goals"    element={<SavingsGoal />}     />
          <Route path="/networth" element={<NetWorthTracker />} />
          <Route path="/market"   element={<MarketData />}      />
          <Route path="/invest"   element={<InvestmentGuide />} />
          <Route path="/learn"    element={<DailyLesson />}     />
          <Route path="/rewards"  element={<RewardWallet />}    />
          <Route path="/profile"  element={<ProfilePage />}     />
          <Route path="/glossary" element={<FinanceGlossary />} />
        </Routes>
      </main>
    </div>
  );
}
