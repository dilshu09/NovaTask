import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
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
import Logo from '../components/Logo';
import NovaAvatar from '../components/NovaAvatar';

const DashboardLayout = () => {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { voiceState, startListening, stopListening } = useVoice();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [searchQuery, setSearchQuery] = useState('');

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
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f7f8fc] text-zinc-800 font-sans">
      
      {/* Sidebar - Desktop Layout (Dark Theme) */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[#1a192e]/10 bg-[#0b0a15] p-6 justify-between shrink-0 text-zinc-400 relative z-20">
        
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
        </div>

        {/* User Card at Sidebar Bottom */}
        <div className="pt-6 border-t border-white/5 space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-indigo-500/10 flex items-center justify-center font-bold text-white text-sm">
                {getInitials(user?.name, user?.email)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate" title={user?.email || ''}>{user?.email || 'admin@novatask.ai'}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[9px] text-emerald-400 font-semibold uppercase tracking-wider">Productive</span>
                </div>
              </div>
            </div>
            <button 
              onClick={logout}
              className="text-zinc-500 hover:text-red-400 transition-colors p-1"
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
                <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-indigo-600 text-xs shrink-0">
                  {getInitials(user?.name, user?.email)}
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
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        
        {/* Top Header Utilities */}
        <header className="hidden md:flex w-full items-center justify-between px-10 py-5 bg-white border-b border-zinc-200/50 relative z-10">
          
          {/* Centralized search input */}
          <div className="relative w-full max-w-lg">
            <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
              <button className="p-2 rounded-xl hover:bg-zinc-100 text-zinc-500 transition-colors relative cursor-pointer">
                <Bell className="w-4.5 h-4.5" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </button>
            </div>

            {/* Dark Mode toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-zinc-100 text-zinc-500 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* User Initials Circle */}
            <div 
              onClick={() => navigate('/dashboard/profile')}
              className="w-8.5 h-8.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-indigo-600/10 cursor-pointer"
            >
              M
            </div>
          </div>

        </header>

        {/* Dynamic Nested Page Content */}
        <main className="flex-1 px-8 py-8 md:px-10 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>



      </div>

    </div>
  );
};

export default DashboardLayout;
