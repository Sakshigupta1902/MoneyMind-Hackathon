import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Bell, CheckCheck, AlertTriangle, AlertCircle, Info, CheckCircle, X } from 'lucide-react';

const TYPE_STYLES = {
  danger:  { bg: 'bg-red-500/10 border-red-500/20',    icon: AlertCircle,   iconColor: 'text-red-400'     },
  warning: { bg: 'bg-yellow-500/10 border-yellow-500/20', icon: AlertTriangle, iconColor: 'text-yellow-400' },
  success: { bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle, iconColor: 'text-emerald-400' },
  info:    { bg: 'bg-blue-500/10 border-blue-500/20',   icon: Info,          iconColor: 'text-blue-400'    },
};

export default function NotificationBell({ onCountChange }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef(null);

  const fetchNotifications = async () => {
    try {
      const { data } = await axios.get('/api/notifications');
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      onCountChange?.(data.unreadCount);
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkAll = async () => {
    await axios.put('/api/notifications/read-all');
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    onCountChange?.(0);
  };

  const handleMarkOne = async (id) => {
    await axios.put(`/api/notifications/${id}/read`);
    setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Abhi';
    if (mins < 60) return `${mins}m pehle`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h pehle`;
    return `${Math.floor(hrs / 24)}d pehle`;
  };

  return (
    <div className="relative" ref={ref}>
      {/* Bell Button */}
      <button
        onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}
        className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 w-96 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-400" />
              <span className="font-semibold text-white text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount} new</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={handleMarkAll}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  <CheckCheck className="w-3.5 h-3.5" /> Sab padha
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-10">
                <Bell className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Koi notification nahi hai</p>
              </div>
            ) : (
              notifications.map((n) => {
                const style = TYPE_STYLES[n.type] || TYPE_STYLES.info;
                const Icon = style.icon;
                return (
                  <div
                    key={n._id}
                    onClick={() => !n.isRead && handleMarkOne(n._id)}
                    className={`flex gap-3 p-4 border-b border-gray-800 transition-colors cursor-pointer hover:bg-gray-800/50 ${!n.isRead ? 'bg-gray-800/30' : ''}`}
                  >
                    <div className={`p-2 rounded-lg border flex-shrink-0 h-fit ${style.bg}`}>
                      <Icon className={`w-4 h-4 ${style.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-semibold ${!n.isRead ? 'text-white' : 'text-gray-400'}`}>
                          {n.title}
                        </p>
                        {!n.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />}
                      </div>
                      <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="text-gray-600 text-xs mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
