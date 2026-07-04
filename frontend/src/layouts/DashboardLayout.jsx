import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useVoice } from '../contexts/VoiceContext';
import { 
  Sparkles, 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  Target, 
  LineChart, 
  Briefcase, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Bell,
  Sun,
  Moon,
  Search,
  ChevronDown
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Logo from '../components/Logo';
import NovaAvatar from '../components/NovaAvatar';

const DashboardLayout = () => {
  const { user, settings, updateSettings, loading, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { voiceState, startListening, stopListening } = useVoice();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notificationsList, setNotificationsList] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');

  const [selectedMember, setSelectedMember] = useState(null);
  const members = settings?.members || [];

  const handleRemoveMember = async (email) => {
    const updatedMembers = members.filter(m => m.email.toLowerCase() !== email.toLowerCase());
    await updateSettings({ members: updatedMembers });
    setSelectedMember(null);
  };

  const handleChangeRole = async (email, newRole) => {
    const updatedMembers = members.map(m => 
      m.email.toLowerCase() === email.toLowerCase() ? { ...m, role: newRole } : m
    );
    await updateSettings({ members: updatedMembers });
  };

  const searchInputRef = React.useRef(null);

  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/users/notifications');
      const list = res.data.data || [];
      setNotificationsList(list);
      setUnreadNotifications(list.filter(n => !n.isRead).length);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const getInitials = (name, email) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'US';
  };

  // Protected route check
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            className="w-10 h-10 border-t-2 border-r-2 border-indigo-500 rounded-full"
          />
          <span className="text-zinc-500 text-sm font-light">Loading workspace...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Exact Sidebar menu items
  const menuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'My Tasks', path: '/dashboard/tasks', icon: <CheckSquare className="w-4 h-4" /> },
    { label: 'Settings', path: '/dashboard/settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const handleNavClick = (item) => {
    navigate(item.path);
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col md:flex-row bg-[#f7f8fc] text-zinc-800 font-sans">
      
      {/* Sidebar - Desktop Layout (Dark Theme) */}
      <aside className="hidden md:flex flex-col h-full w-64 border-r border-[#1a192e]/10 bg-[#0b0a15] p-6 justify-between shrink-0 text-zinc-400 relative z-20 overflow-y-auto hide-scrollbar">
        
        <div className="space-y-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 px-2">
            <Logo className="w-8 h-8" />
            <div className="flex flex-col -space-y-1">
              <span className="font-display font-bold text-base text-white tracking-tight">
                NovaTask
              </span>
              <span className="text-[9px] text-zinc-500 font-light">Workspace</span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              // Highlight selected tab
              const isActive = location.pathname === item.path || (item.label === 'Dashboard' && location.pathname === '/dashboard');
              return (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#5045e4] to-[#8d37e6] text-white shadow-md shadow-[#5045e4]/10'
                      : 'hover:text-white hover:bg-white/5 text-zinc-400'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Workspace Team Sidebar Directory */}
          <div className="pt-5 border-t border-white/5 space-y-3">
            <div className="flex items-center justify-between px-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              <span>Workspace Team</span>
              <span className="px-1.5 py-0.5 rounded-full bg-white/5 text-zinc-400 font-bold text-[8px]">{members.length}</span>
            </div>

            <div className="space-y-1 max-h-[180px] overflow-y-auto hide-scrollbar">
              {members.map((m) => {
                const nameInitials = m.name 
                  ? m.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() 
                  : (m.email || '').slice(0, 2).toUpperCase();
                
                const isOnline = m.role === 'owner' || m.status === 'active';

                return (
                  <div key={m.email} className="group flex items-center justify-between px-2 py-1.5 hover:bg-white/5 rounded-xl transition-all text-xs font-medium">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6.5 h-6.5 rounded-full overflow-hidden border border-white/10 shrink-0 bg-white/10 flex items-center justify-center font-bold text-indigo-400 text-[9px] relative">
                        {m.avatar ? (
                          <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                        ) : (
                          nameInitials
                        )}
                        <span className={`absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full border border-zinc-950 ${isOnline ? 'bg-emerald-500' : 'bg-zinc-500'}`} />
                      </div>
                      <div className="min-w-0 flex flex-col -space-y-0.5">
                        <span className="text-[11px] font-bold text-zinc-200 truncate" title={m.name || m.email}>{m.name || m.email}</span>
                        <span className="text-[8px] text-zinc-500 capitalize">{m.role}</span>
                      </div>
                    </div>

                    {m.role !== 'owner' && (
                      <button 
                        onClick={() => setSelectedMember(m)}
                        className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-white transition-opacity p-0.5 cursor-pointer"
                        title="Manage member"
                      >
                        <Settings className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* User Card at Sidebar Bottom */}
        <div className="pt-6 border-t border-white/5 space-y-4">
          <div className="flex items-center justify-between gap-2 px-1 min-w-0">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-9.5 h-9.5 rounded-full overflow-hidden border border-white/10 shrink-0 flex items-center justify-center font-bold text-white text-sm bg-indigo-500/10">
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name || 'User'} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const parent = e.target.parentNode;
                      if (parent) {
                        parent.innerHTML = `<div class="w-full h-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">${getInitials(user?.name, user?.email)}</div>`;
                      }
                    }}
                  />
                ) : (
                  getInitials(user?.name, user?.email)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate" title={user?.email || ''}>{user?.email || 'admin@novatask.ai'}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[9px] text-emerald-400 font-semibold uppercase tracking-wider">Productive</span>
                </div>
              </div>
            </div>
            <button 
              onClick={logout}
              className="text-zinc-500 hover:text-red-400 transition-colors p-1.5 shrink-0 cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </aside>

      {/* Header - Mobile Layout */}
      <header className="md:hidden w-full px-6 py-4 border-b border-zinc-200 bg-white flex items-center justify-between z-20">
        <Link to="/" className="flex items-center gap-2">
          <Logo className="w-7 h-7" />
          <span className="font-display font-bold tracking-tight text-black text-sm">
            NOVATASK
          </span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-zinc-100 text-zinc-700"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed inset-x-0 top-[61px] bg-white border-b border-zinc-200 z-30 p-6 space-y-6 shadow-xl"
          >
            <nav className="flex flex-col gap-1">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path || (item.label === 'Dashboard' && location.pathname === '/dashboard');
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleNavClick(item);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-zinc-500 hover:bg-zinc-50'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="pt-6 border-t border-zinc-100 flex items-center justify-between">
              <div className="flex-grow flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-zinc-200/50">
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name || 'User'} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const parent = e.target.parentNode;
                        if (parent) {
                          parent.innerHTML = `<div class="w-full h-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">${getInitials(user?.name, user?.email)}</div>`;
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                      {getInitials(user?.name, user?.email)}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-zinc-800 truncate" title={user?.email || ''}>{user?.email || 'admin@novatask.ai'}</p>
                  <p className="text-[9px] text-emerald-600 font-medium">● Productive</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="text-xs text-red-500 font-semibold flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content panel (Light Mode Styling) */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        
        {/* Top Header Utilities */}
        <header className="hidden md:flex w-full items-center justify-between px-10 py-5 bg-white border-b border-zinc-200/50 relative z-10">
          
          {/* Centralized search input */}
          <div className="relative w-full max-w-lg">
            <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                const params = new URLSearchParams(window.location.search);
                if (val) {
                  params.set('search', val);
                } else {
                  params.delete('search');
                }
                navigate({ search: params.toString() }, { replace: true });
              }}
              placeholder="Search tasks, projects or ask Nova..."
              className="w-full pl-11 pr-14 py-2.5 bg-zinc-50 border border-zinc-200/70 rounded-xl focus:border-indigo-500 focus:bg-white focus:outline-none text-xs text-zinc-800 placeholder-zinc-400 transition-all"
            />
            {/* Keyboard short label */}
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 font-semibold bg-zinc-200/60 px-1.5 py-0.5 rounded font-mono">
              ⌘ K
            </span>
          </div>

          {/* Right Header utilities */}
          <div className="flex items-center gap-5">
            {/* Notifications Bell */}
            <div className="relative">
              <button 
                onClick={() => {
                  setIsNotifOpen(!isNotifOpen);
                  if (!isNotifOpen) fetchNotifications();
                }}
                className={`p-2 rounded-xl transition-colors relative cursor-pointer ${
                  isNotifOpen ? 'bg-zinc-100 text-indigo-650' : 'hover:bg-zinc-100 text-zinc-500'
                }`}
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
                    {unreadNotifications}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isNotifOpen && (
                  <>
                    <div className="fixed inset-0 z-35" onClick={() => setIsNotifOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-72 bg-white border border-zinc-150 rounded-2xl shadow-xl p-4 z-40 max-h-96 overflow-y-auto space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                        <span className="text-xs font-bold text-black font-display">Notifications</span>
                        {unreadNotifications > 0 && (
                          <button
                            onClick={async () => {
                              try {
                                await Promise.all(
                                  notificationsList
                                    .filter(n => !n.isRead)
                                    .map(n => api.put(`/users/notifications/${n._id}/read`))
                                );
                                fetchNotifications();
                              } catch (e) {
                                console.error('Failed to mark all as read', e);
                              }
                            }}
                            className="text-[9px] font-semibold text-indigo-600 hover:text-indigo-500 cursor-pointer animate-fade-in"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                      <div className="space-y-2.5">
                        {notificationsList.length === 0 ? (
                          <div className="text-center py-6 text-zinc-400 text-[10px] font-light">
                            No notifications yet
                          </div>
                        ) : (
                          notificationsList.map(n => (
                            <div 
                              key={n._id}
                              onClick={async () => {
                                if (!n.isRead) {
                                  try {
                                    await api.put(`/users/notifications/${n._id}/read`);
                                    fetchNotifications();
                                  } catch (e) {}
                                }
                              }}
                              className={`p-2.5 rounded-xl border text-[10px] cursor-pointer transition-all ${
                                n.isRead 
                                  ? 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-100 dark:border-zinc-700/50 text-zinc-450 dark:text-zinc-400' 
                                  : 'bg-indigo-50/30 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/50 text-zinc-700 dark:text-indigo-200 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-0.5">
                                <span className={`font-bold ${n.isRead ? 'text-zinc-500 dark:text-zinc-400' : 'text-indigo-950 dark:text-indigo-200 font-display'}`}>{n.title}</span>
                                {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-500 shrink-0 mt-1" />}
                              </div>
                              <p className="leading-relaxed font-light text-zinc-650 dark:text-zinc-300">{n.message}</p>
                              <span className="text-[8px] text-zinc-400 font-mono mt-1 block">
                                {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Dark Mode toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-zinc-100 text-zinc-500 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* User Profile Image / Initials */}
            <div 
              onClick={() => navigate('/dashboard/profile')}
              className="w-8.5 h-8.5 rounded-full overflow-hidden flex items-center justify-center cursor-pointer shadow-md shadow-indigo-600/10 border border-zinc-200/50"
            >
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name || 'User'} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback if image fails to load
                    e.target.style.display = 'none';
                    const parent = e.target.parentNode;
                    if (parent) {
                      parent.innerHTML = `<div class="w-full h-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">${getInitials(user?.name, user?.email)}</div>`;
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center font-bold text-xs">
                  {getInitials(user?.name, user?.email)}
                </div>
              )}
            </div>
          </div>

        </header>

        {/* Dynamic Nested Page Content */}
        <main className="flex-1 px-8 py-8 md:px-10 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>



      </div>

      {/* Manage Collaborator Modal */}
      <AnimatePresence>
        {selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMember(null)}
              className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-zinc-200 shadow-2xl p-6 w-full max-w-sm space-y-5 relative z-10"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-black uppercase tracking-wider">Manage Team Member</h3>
                <button 
                  onClick={() => setSelectedMember(null)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-650 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3 bg-zinc-50 p-3 rounded-2xl border border-zinc-150">
                <div className="w-9.5 h-9.5 rounded-full overflow-hidden bg-indigo-50 border border-zinc-150 flex items-center justify-center font-bold text-indigo-650 text-xs shrink-0">
                  {selectedMember.avatar ? (
                    <img src={selectedMember.avatar} alt={selectedMember.name} className="w-full h-full object-cover" />
                  ) : (
                    selectedMember.name ? selectedMember.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : (selectedMember.email || '').slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-zinc-800 truncate">{selectedMember.name || 'Collaborator'}</h4>
                  <p className="text-[10px] text-zinc-450 truncate">{selectedMember.email}</p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-semibold text-zinc-450 uppercase tracking-wide">Workspace Role</label>
                  <select
                    value={selectedMember.role}
                    onChange={async (e) => {
                      const newRole = e.target.value;
                      setSelectedMember(prev => ({ ...prev, role: newRole }));
                      await handleChangeRole(selectedMember.email, newRole);
                    }}
                    className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none cursor-pointer"
                  >
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>

                <button
                  onClick={async () => {
                    await handleRemoveMember(selectedMember.email);
                  }}
                  className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Remove Member from Workspace
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default DashboardLayout;
