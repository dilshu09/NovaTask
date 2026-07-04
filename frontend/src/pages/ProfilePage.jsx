import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, 
  Mail, 
  Calendar, 
  Activity, 
  Bell, 
  Check, 
  Trash2, 
  AlertCircle,
  FileCode,
  CheckCircle2
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { slideUp, staggerContainer } from '../animations/motion';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  
  // Profile Form States
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Lists States
  const [logs, setLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  const fetchProfileData = async () => {
    try {
      const [logsRes, notifsRes] = await Promise.all([
        api.get('/users/activities'),
        api.get('/users/notifications')
      ]);
      setLogs(logsRes.data.data);
      setNotifications(notifsRes.data.data);
    } catch (e) {
      console.error('Failed to load profile lists');
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    setSavingProfile(true);
    const res = await updateProfile(name, avatar);
    setSavingProfile(false);
    if (res.success) {
      fetchProfileData();
    }
  };

  const handleMarkNotificationRead = async (id) => {
    try {
      await api.put(`/users/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
      toast.success('Alert marked as read');
    } catch (e) {
      toast.error('Action failed');
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await api.delete(`/users/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success('Alert removed');
    } catch (e) {
      toast.error('Action failed');
    }
  };

  return (
    <motion.div 
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-8 text-zinc-700"
    >
      {/* Page Header */}
      <motion.div variants={slideUp}>
        <h1 className="text-3xl font-display font-bold text-black tracking-tight">Your Profile</h1>
        <p className="text-zinc-500 text-sm font-light">Manage your avatar properties and monitor workspace audits.</p>
      </motion.div>

      {/* Main Splits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Profile Card Editor */}
        <motion.div variants={slideUp} className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-6">
            
            {/* Visual Avatar Bubble */}
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="relative">
                {avatar ? (
                  <img src={avatar} alt="avatar" className="w-24 h-24 rounded-full object-cover border border-zinc-200" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-3xl">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-black">{user.name}</h3>
                <span className="text-xs text-zinc-500 font-mono">{user.email}</span>
              </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 rounded-xl border border-zinc-200 focus:border-indigo-500 focus:outline-none text-sm text-zinc-800 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Avatar URL</label>
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 rounded-xl border border-zinc-200 focus:border-indigo-500 focus:outline-none text-sm text-zinc-800 placeholder-zinc-400 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-indigo-600/10 disabled:opacity-50"
              >
                {savingProfile ? 'Saving...' : 'Update Profile'}
              </button>
            </form>

            <div className="pt-4 border-t border-zinc-100 flex items-center gap-2 text-zinc-500 text-xs font-light">
              <Calendar className="w-4 h-4 text-zinc-500" />
              Member since: {new Date(user.createdAt).toLocaleDateString()}
            </div>

          </div>
        </motion.div>

        {/* Right Column: Notifications and Audit logs */}
        <motion.div variants={slideUp} className="lg:col-span-2 space-y-8">
          
          {/* Notifications Panel */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-600" />
              <h2 className="font-display font-semibold text-lg text-black">Inbox Notifications</h2>
            </div>

            <div className="space-y-3">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div 
                    key={notif._id}
                    className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-colors ${
                      notif.isRead 
                        ? 'bg-zinc-50/50 border-zinc-100 text-zinc-400' 
                        : 'bg-indigo-50/30 border-indigo-100 text-zinc-800'
                    }`}
                  >
                    <div className="flex gap-3">
                      <AlertCircle className={`w-5 h-5 shrink-0 ${
                        notif.isRead ? 'text-zinc-400' : 'text-indigo-500'
                      }`} />
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-semibold">{notif.title}</h4>
                        <p className="text-xs text-zinc-550 font-light leading-relaxed">{notif.message}</p>
                      </div>
                    </div>

                    <div className="flex gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {!notif.isRead && (
                        <button
                          onClick={() => handleMarkNotificationRead(notif._id)}
                          className="p-1.5 rounded bg-zinc-100 hover:bg-zinc-200 text-emerald-600 transition-colors cursor-pointer"
                          title="Mark as Read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNotification(notif._id)}
                        className="p-1.5 rounded bg-zinc-100 hover:bg-zinc-200 text-red-650 transition-colors cursor-pointer"
                        title="Delete Alert"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-zinc-500 font-light border border-dashed border-zinc-200 rounded-xl">
                  Your inbox is completely clear!
                </div>
              )}
            </div>
          </div>

          {/* User Audit Activity Logs */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              <h2 className="font-display font-semibold text-lg text-black">Operational Audit Trail</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 text-zinc-500 font-mono">
                    <th className="py-2.5 px-2">Timestamp</th>
                    <th className="py-2.5 px-2">Action type</th>
                    <th className="py-2.5 px-2">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingLogs ? (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-zinc-500 animate-pulse">Loading operations history...</td>
                    </tr>
                  ) : logs.length > 0 ? (
                    logs.map((log) => (
                      <tr key={log._id} className="border-b border-zinc-100 text-zinc-700 font-light">
                        <td className="py-3 px-2 font-mono text-[10px] text-zinc-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-2">
                          <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 font-mono text-[10px] text-indigo-600 uppercase">
                            {log.action.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-2 font-medium">{log.details}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-zinc-500">No actions recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </motion.div>

      </div>

    </motion.div>
  );
};

export default ProfilePage;
