import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react'; // Ye add karna hai
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { TrendingUp } from 'lucide-react';

export default function AuthPage() {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', monthlyIncome: '', city: '', languagePreference: 'hinglish' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password, monthlyIncome: Number(form.monthlyIncome), city: form.city, languagePreference: form.languagePreference };
      const { data } = await axios.post(endpoint, payload);
      login(data);
      toast.success(isLogin ? 'Welcome back!' : 'Account created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="bg-blue-600 p-3 rounded-xl">
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">MoneyMind</h1>
            <p className="text-xs text-gray-400">Smart Financial Management</p>
          </div>
        </div>

        <div className="card">
          {/* Tabs */}
          <div className="flex bg-gray-800 rounded-lg p-1 mb-6">
            {['Login', 'Register'].map((tab) => (
              <button
                key={tab}
                onClick={() => setIsLogin(tab === 'Login')}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                  (tab === 'Login') === isLogin ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="label">Full Name</label>
                <input className="input" placeholder="John Doe" value={form.name} onChange={set('name')} required />
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input className="input w-full pr-10" type={showPassword ? "text" : "password"} placeholder="••••••••" value={form.password} onChange={set('password')} required minLength={6} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-200"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {!isLogin && (
              <div>
                <label className="label">Monthly Income (₹)</label>
                <input className="input" type="number" placeholder="50000" value={form.monthlyIncome} onChange={set('monthlyIncome')} required min={0} />
              </div>
            )}
            {!isLogin && (
              <div>
                <label className="label">City</label>
                <input className="input" type="text" placeholder="e.g. Mumbai, Bangalore..." value={form.city} onChange={set('city')} required />
              </div>
            )}
            {!isLogin && (
              <div>
                <label className="label">Preferred Language (App & AI)</label>
                <select className="input" value={form.languagePreference} onChange={set('languagePreference')}>
                  <option value="hinglish">Hinglish (Simple & Friendly)</option>
                  <option value="english">English (Professional)</option>
                </select>
              </div>
            )}
            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
