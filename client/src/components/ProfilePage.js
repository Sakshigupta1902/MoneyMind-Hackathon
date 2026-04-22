import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { User, Lock, Save, TrendingUp } from 'lucide-react';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const { language } = useLanguage();
  
  const isEng = language === 'english';

  const [profileForm, setProfileForm] = useState({
    name:          user?.name          || '',
    phone:         user?.phone         || '',
    occupation:    user?.occupation    || '',
    age:           user?.age           || '',
    monthlyIncome: user?.monthlyIncome || '',
    city:          user?.city          || '',
    languagePreference: user?.languagePreference || 'hinglish',
  });

  const [passForm, setPassForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass,    setSavingPass]    = useState(false);
  const [activeTab,     setActiveTab]     = useState('profile');

  // Avatar — initials based
  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const avatarColors = ['bg-blue-600', 'bg-purple-600', 'bg-emerald-600', 'bg-orange-600', 'bg-pink-600'];
  const avatarColor  = avatarColors[(user?.name?.charCodeAt(0) || 0) % avatarColors.length];

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await axios.put('/api/auth/profile', {
        ...profileForm,
        age:           Number(profileForm.age)           || null,
        monthlyIncome: Number(profileForm.monthlyIncome) || 0,
      });
      setUser(data);
      toast.success(isEng ? 'Profile updated successfully! ✅' : 'Profile update ho gaya! ✅');
    } catch (err) {
      toast.error(err.response?.data?.message || (isEng ? 'Update failed' : 'Update nahi hua'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePassChange = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword)
      return toast.error(isEng ? 'Passwords do not match' : 'New passwords match nahi kar rahe');
    if (passForm.newPassword.length < 6)
      return toast.error(isEng ? 'Password must be at least 6 characters' : 'Password kam se kam 6 characters ka hona chahiye');
    setSavingPass(true);
    try {
      await axios.put('/api/auth/change-password', {
        currentPassword: passForm.currentPassword,
        newPassword:     passForm.newPassword,
      });
      toast.success(isEng ? 'Password changed successfully! 🔒' : 'Password change ho gaya! 🔒');
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || (isEng ? 'Failed to change password' : 'Password change nahi hua'));
    } finally {
      setSavingPass(false);
    }
  };

  const setP  = (f) => (e) => setProfileForm(p => ({ ...p, [f]: e.target.value }));
  const setPw = (f) => (e) => setPassForm(p => ({ ...p, [f]: e.target.value }));

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-white">{isEng ? 'My Profile' : 'Meri Profile'}</h2>

      {/* Avatar + Name Card */}
      <div className="card flex items-center gap-5">
        <div className={`w-20 h-20 rounded-2xl ${avatarColor} flex items-center justify-center flex-shrink-0`}>
          <span className="text-white font-bold text-3xl">{initials}</span>
        </div>
        <div>
          <h3 className="text-white font-bold text-xl">{user?.name}</h3>
          <p className="text-gray-400 text-sm">{user?.email}</p>
          {user?.occupation && <p className="text-gray-500 text-sm mt-0.5">{user?.occupation}</p>}
          <div className="flex items-center gap-2 mt-2">
            <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full">
              💰 ₹{user?.monthlyIncome?.toLocaleString()}/month
            </span>
            {user?.age && (
              <span className="bg-gray-700 text-gray-400 text-xs px-2 py-0.5 rounded-full">
                🎂 {user?.age} years
              </span>
            )}
            {user?.city && (
              <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full">
                📍 {user?.city}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-900 border border-gray-800 rounded-xl p-1 gap-1 w-fit">
        {[
          { val: 'profile',  label: isEng ? '👤 Edit Profile' : '👤 Profile Edit Karein' },
          { val: 'password', label: isEng ? '🔒 Change Password' : '🔒 Password Badlein' },
        ].map(({ val, label }) => (
          <button key={val} onClick={() => setActiveTab(val)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === val ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Profile Form */}
      {activeTab === 'profile' && (
        <div className="card">
          <h3 className="font-semibold text-white mb-5 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" /> {isEng ? 'Personal Information' : 'Personal Jankari'}
          </h3>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">{isEng ? 'Full Name' : 'Poora Naam'}</label>
                <input className="input" placeholder="John Doe"
                  value={profileForm.name} onChange={setP('name')} required />
              </div>
              <div>
                <label className="label">{isEng ? 'Phone Number' : 'Phone Number'}</label>
                <input className="input" placeholder="+91 98765 43210"
                  value={profileForm.phone} onChange={setP('phone')} />
              </div>
              <div>
                <label className="label">{isEng ? 'Occupation' : 'Kaam / Occupation'}</label>
                <input className="input" placeholder="Software Engineer, Teacher..."
                  value={profileForm.occupation} onChange={setP('occupation')} />
              </div>
              <div>
                <label className="label">{isEng ? 'Age' : 'Umar (Age)'}</label>
                <input className="input" type="number" placeholder="25"
                  value={profileForm.age} onChange={setP('age')} min={1} max={100} />
              </div>
              <div>
                <label className="label">{isEng ? 'City' : 'Shehar (City)'}</label>
                <input className="input" type="text" placeholder="e.g. Mumbai, Bangalore..."
                  value={profileForm.city} onChange={setP('city')} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">{isEng ? 'Monthly Income (₹)' : 'Mahine ki Kamayi (₹)'}</label>
                <input className="input" type="number" placeholder="50000"
                  value={profileForm.monthlyIncome} onChange={setP('monthlyIncome')} min={0} />
                <p className="text-gray-500 text-xs mt-1">
                  {isEng ? 'Changing this will update budget and AI advice' : 'Ye change karne se budget suggestions aur AI advice update ho jaayegi'}
                </p>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Preferred Language (App & AI)</label>
                <select className="input"
                  value={profileForm.languagePreference} onChange={setP('languagePreference')}>
                  <option value="hinglish">Hinglish (Simple & Friendly)</option>
                  <option value="english">English (Professional)</option>
                </select>
                <p className="text-gray-500 text-xs mt-1">
                  {isEng ? 'FinBot and AI will talk to you in this language' : 'Is bhasha mein FinBot aur AI aapse baat karenge'}
                </p>
              </div>
            </div>
            <button type="submit" className="btn-primary flex items-center gap-2" disabled={savingProfile}>
              <Save className="w-4 h-4" />
              {savingProfile ? (isEng ? 'Saving...' : 'Save ho raha hai...') : (isEng ? 'Save Profile' : 'Profile Save Karo')}
            </button>
          </form>
        </div>
      )}

      {/* Password Form */}
      {activeTab === 'password' && (
        <div className="card">
          <h3 className="font-semibold text-white mb-5 flex items-center gap-2">
            <Lock className="w-5 h-5 text-yellow-400" /> Change Password
          </h3>
          <form onSubmit={handlePassChange} className="space-y-4 max-w-sm">
            <div>
              <label className="label">{isEng ? 'Current Password' : 'Purana Password'}</label>
              <input className="input" type="password" placeholder="••••••••"
                value={passForm.currentPassword} onChange={setPw('currentPassword')} required />
            </div>
            <div>
              <label className="label">{isEng ? 'New Password' : 'Naya Password'}</label>
              <input className="input" type="password" placeholder="••••••••"
                value={passForm.newPassword} onChange={setPw('newPassword')} required minLength={6} />
            </div>
            <div>
              <label className="label">{isEng ? 'Confirm New Password' : 'Naya Password Confirm Karo'}</label>
              <input className="input" type="password" placeholder="••••••••"
                value={passForm.confirmPassword} onChange={setPw('confirmPassword')} required minLength={6} />
            </div>
            <button type="submit" className="btn-primary flex items-center gap-2" disabled={savingPass}>
              <Lock className="w-4 h-4" />
              {savingPass ? (isEng ? 'Changing...' : 'Change ho raha hai...') : (isEng ? 'Change Password' : 'Password Change Karo')}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
