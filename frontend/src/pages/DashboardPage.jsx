import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Activity, 
  ArrowRight, 
  Plus, 
  CheckSquare, 
  ChevronRight,
  TrendingUp,
  AlertCircle,
  FolderOpen,
  Flag,
  Play,
  Lightbulb,
  Coffee,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Compass,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { slideUp, staggerContainer } from '../animations/motion';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const getGreeting = () => {
    try {
      const colomboTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Colombo" }));
      const hours = colomboTime.getHours();
      if (hours < 12) return 'Good Morning';
      if (hours < 18) return 'Good Afternoon';
      return 'Good Evening';
    } catch (e) {
      const hours = new Date().getHours();
      if (hours < 12) return 'Good Morning';
      if (hours < 18) return 'Good Afternoon';
      return 'Good Evening';
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [tasksRes, activitiesRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/users/activities')
      ]);
      setTasks(tasksRes.data.data || []);
      setActivities(activitiesRes.data.data || []);
    } catch (e) {
      console.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Listen for custom voice command task creations
    const handleVoiceTask = () => fetchDashboardData();
    window.addEventListener('task_created_via_voice', handleVoiceTask);
    return () => window.removeEventListener('task_created_via_voice', handleVoiceTask);
  }, []);

  const toggleTaskDone = async (task) => {
    const nextStatus = task.status === 'done' ? 'todo' : 'done';
    
    // Optimistic UI update
    setTasks(prev => 
      prev.map(t => t._id === task._id ? { ...t, status: nextStatus } : t)
    );

    try {
      await api.put(`/tasks/${task._id}`, { status: nextStatus });
      toast.success('Task status updated');
      fetchDashboardData();
    } catch (err) {
      toast.error('Failed to update task status');
      fetchDashboardData();
    }
  };

  const handleAddNewTask = () => {
    navigate('/dashboard/tasks?create=true');
  };

  // Calculate dynamic stats
  const totalTasksCount = tasks.length;
  const completedCount = tasks.filter(t => t.status === 'done').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const highPriorityCount = tasks.filter(t => t.priority === 'high' && t.status !== 'done').length;
  const completionRate = totalTasksCount > 0 ? Math.round((completedCount / totalTasksCount) * 100) : 0;

  // Group database tasks by category to show dynamic project categories
  const getCategoryStats = () => {
    const categories = ['development', 'design', 'marketing', 'finance', 'operations', 'general'];
    return categories.map(cat => {
      const catTasks = tasks.filter(t => t.category === cat);
      const total = catTasks.length;
      const completed = catTasks.filter(t => t.status === 'done').length;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      let label = cat.charAt(0).toUpperCase() + cat.slice(1);
      let icon = '⚡';
      let bgClass = 'bg-emerald-500';
      let iconBg = 'bg-emerald-500/10 text-emerald-600';
      if (cat === 'development') { icon = '💻'; bgClass = 'bg-purple-500'; iconBg = 'bg-purple-500/10 text-purple-600'; }
      else if (cat === 'design') { icon = '⌘'; bgClass = 'bg-blue-500'; iconBg = 'bg-blue-500/10 text-blue-600'; }
      else if (cat === 'marketing') { icon = '⚡'; bgClass = 'bg-emerald-500'; iconBg = 'bg-emerald-500/10 text-emerald-600'; }
      else if (cat === 'finance') { icon = '💵'; bgClass = 'bg-amber-500'; iconBg = 'bg-amber-50/10 text-amber-600'; }
      else if (cat === 'operations') { icon = '⚙'; bgClass = 'bg-zinc-500'; iconBg = 'bg-zinc-500/10 text-zinc-650'; }
      else if (cat === 'general') { icon = '📁'; bgClass = 'bg-zinc-400'; iconBg = 'bg-zinc-400/10 text-zinc-500'; }

      return { label, count: total, pct, icon, bgClass, iconBg };
    }).filter(item => item.count > 0);
  };

  // Get active upcoming deadlines from database tasks
  const getDeadlineTasks = () => {
    return tasks
      .filter(t => t.dueDate && t.status !== 'done')
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 4);
  };

  const formatDateHeader = (dateStr) => {
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      month: months[d.getMonth()],
      day: d.getDate()
    };
  };

  const getDaysLeftText = (dateStr) => {
    const diffTime = new Date(dateStr) - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return '1 day left';
    return `${diffDays} days left`;
  };

  const timeAgo = (dateStr) => {
    const diffMs = new Date() - new Date(dateStr);
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Filter tasks for "Today's Plan" display (first 6 items)
  const todaysPlanTasks = tasks.slice(0, 6);

  // Calendar days grid generator for May 2024
  const calendarDays = [
    { day: 28, mock: true }, { day: 29, mock: true }, { day: 30, mock: true }, 
    { day: 1 }, { day: 2 }, { day: 3 }, { day: 4 }, { day: 5 }, { day: 6 }, 
    { day: 7 }, { day: 8 }, { day: 9 }, { day: 10 }, { day: 11 }, { day: 12 }, 
    { day: 13 }, { day: 14 }, { day: 15, active: true }, { day: 16 }, { day: 17 }, 
    { day: 18 }, { day: 19 }, { day: 20 }, { day: 21 }, { day: 22 }, { day: 23 }, 
    { day: 24 }, { day: 25 }, { day: 26 }, { day: 27 }, { day: 28 }, { day: 29 }, 
    { day: 30 }, { day: 31 }, { day: 1, mock: true }
  ];

  return (
    <motion.div 
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6 text-zinc-700 pb-12"
    >
      
      {/* Welcome Banner */}
      <motion.div variants={slideUp} className="space-y-1">
        <h1 className="text-2xl font-display font-extrabold text-black tracking-tight flex items-center gap-2">
          {getGreeting()}, {user?.name || 'User'}! 👋
        </h1>
        <p className="text-zinc-400 text-xs font-light">
          Let's make today amazing.
        </p>
      </motion.div>

      {/* Metrics Row (4 Cards) */}
      <motion.div variants={slideUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* All Tasks */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">All Tasks</span>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-extrabold text-black">{totalTasksCount}</p>
              <span className="text-xs text-blue-500 font-semibold flex items-center">↑ 12%</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
            <FolderOpen className="w-5 h-5 fill-blue-50/20" />
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Completed</span>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-extrabold text-emerald-600">{completedCount}</p>
              <span className="text-xs text-emerald-500 font-semibold flex items-center">↑ 8%</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
            <CheckCircle2 className="w-5 h-5 fill-emerald-50/20" />
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">In Progress</span>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-extrabold text-black">{inProgressCount}</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* High Priority */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">High Priority</span>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-extrabold text-red-600">{highPriorityCount}</p>
              <span className="text-xs text-red-500 font-semibold flex items-center">↑ 25%</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
            <Flag className="w-5 h-5 fill-red-50" />
          </div>
        </div>

      </motion.div>

      {/* Middle Grid Section (4 Columns layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Panel 1: Today's Plan */}
        <motion.div variants={slideUp} className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm flex flex-col justify-between min-h-[360px]">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-display font-bold text-sm text-black">Today's Plan</h3>
                <span className="text-[10px] text-zinc-400 font-light">{totalTasksCount} tasks scheduled</span>
              </div>
              <button 
                onClick={handleAddNewTask}
                className="w-7 h-7 rounded-lg bg-zinc-50 border border-zinc-100 hover:bg-zinc-100 flex items-center justify-center text-zinc-600 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Task list checkboxes */}
            <div className="space-y-3.5">
              {loading ? (
                <div className="p-8 text-center text-xs text-zinc-400 animate-pulse">Loading daily schedules...</div>
              ) : todaysPlanTasks.length > 0 ? (
                todaysPlanTasks.map((task) => {
                  const isDone = task.status === 'done';
                  const isHigh = task.priority === 'high';
                  return (
                    <div key={task._id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input 
                          type="checkbox"
                          checked={isDone}
                          onChange={() => toggleTaskDone(task)}
                          className="w-4 h-4 rounded-full border-zinc-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                        />
                        <span className={`font-semibold truncate ${isDone ? 'line-through text-zinc-400 font-light' : 'text-zinc-700'}`}>
                          {task.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 text-zinc-400 font-mono text-[10px] pl-2">
                        {isHigh && <Flag className="w-3 h-3 text-red-500 fill-red-500" />}
                        <span>{task.dueDate ? new Date(task.dueDate).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'}) : '9:00 AM'}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-zinc-400 font-light">No tasks scheduled. Click "+" to add!</div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-50">
            <button 
              onClick={() => navigate('/dashboard/tasks')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-500 flex items-center gap-1.5 cursor-pointer"
            >
              View full schedule
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>

        {/* Panel 2: Focus Mode */}
        <motion.div variants={slideUp} className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm flex flex-col justify-between min-h-[360px] relative overflow-hidden">
          
          <div className="relative z-10">
            <h3 className="font-display font-bold text-sm text-black">Focus Mode</h3>
            <span className="text-[10px] text-zinc-400 font-light">Improve your concentration</span>
          </div>

          {/* Core Circular Progress timer visual */}
          <div className="relative flex flex-col items-center justify-center z-10">
            <div className="w-36 h-36 rounded-full flex flex-col items-center justify-center border-4 border-indigo-50 bg-indigo-500/[0.01] shadow-[0_4px_24px_rgba(99,102,241,0.06)] relative">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent transform rotate-45" />
              <span className="font-display font-extrabold text-2xl text-black">25:00</span>
              <button className="absolute bottom-[-10px] w-9 h-9 rounded-full bg-[#5045e4] hover:bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/35 border border-white/20 cursor-pointer">
                <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
              </button>
            </div>
          </div>

          {/* Plant & wave decoration vector styling */}
          <div className="absolute bottom-0 inset-x-0 h-16 pointer-events-none z-0">
            <svg className="w-full h-full text-indigo-50" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path d="M0,25 C30,15 60,35 100,20 L100,30 L0,30 Z" fill="currentColor" opacity="0.3" />
              <path d="M0,20 C40,30 70,10 100,25 L100,30 L0,30 Z" fill="currentColor" opacity="0.5" />
            </svg>
            <div className="absolute bottom-1 right-4 w-7 h-10 flex flex-col justify-end">
              <div className="w-1.5 h-3 bg-amber-700/60 rounded-t mx-auto" />
              <div className="flex justify-center -space-x-1">
                <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full" />
                <div className="w-3.5 h-3.5 bg-emerald-600 rounded-full" />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-50 relative z-10">
            <button className="text-xs font-bold text-indigo-600 flex items-center gap-1.5 cursor-pointer">
              Start Focus Session
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </motion.div>

        {/* Panel 3: AI Suggestions */}
        <motion.div variants={slideUp} className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm flex flex-col justify-between min-h-[360px]">
          <div>
            <h3 className="font-display font-bold text-sm text-black">AI Suggestions</h3>
            <span className="text-[10px] text-zinc-400 font-light">Nova has some ideas for you</span>

            {/* Suggestion cards */}
            <div className="space-y-2.5 mt-4">
              <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100/40 flex items-start gap-2.5">
                <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-[10px] text-blue-900 leading-normal font-medium">
                  You work best between <span className="font-bold">9:00 AM - 11:00 AM</span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100/40 flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-[10px] text-amber-900 leading-normal font-medium">
                  Try completing high priority tasks in the morning
                </p>
              </div>

              <div className="p-3 rounded-xl bg-red-50/50 border border-red-100/40 flex items-start gap-2.5">
                <Coffee className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-[10px] text-red-900 leading-normal font-medium">
                  Time to take a break? You've been focused for 2h
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-50">
            <button className="text-xs font-bold text-indigo-600 flex items-center gap-1.5 cursor-pointer">
              View all insights
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>

        {/* Panel 4: Calendar & Progress Combined Column */}
        <motion.div variants={slideUp} className="space-y-4">
          
          {/* Calendar Box */}
          <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-black font-display">Calendar</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-400 font-semibold font-mono">May 2024</span>
                <div className="flex gap-1">
                  <button className="p-0.5 rounded border border-zinc-100 hover:bg-zinc-50 text-zinc-400"><ChevronLeft className="w-3 h-3" /></button>
                  <button className="p-0.5 rounded border border-zinc-100 hover:bg-zinc-50 text-zinc-400"><ChevronRightIcon className="w-3 h-3" /></button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-7 text-center text-[9px] text-zinc-400 font-bold border-b border-zinc-50 pb-1.5">
              <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
            </div>

            <div className="grid grid-cols-7 text-center gap-y-1.5 text-[9px] font-semibold">
              {calendarDays.map((d, i) => (
                <div key={i} className="flex justify-center items-center">
                  <span className={`w-5 h-5 flex items-center justify-center rounded-full ${
                    d.active ? 'bg-indigo-600 text-white shadow-md' :
                    d.mock ? 'text-zinc-300 font-light' : 'text-zinc-700 hover:bg-zinc-100'
                  }`}>
                    {d.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Circular Gauge Box */}
          <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm flex items-center gap-4">
            {/* Radial progress svg */}
            <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-zinc-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-indigo-600" strokeDasharray={`${completionRate}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <span className="absolute font-display font-extrabold text-[10px] text-black">{completionRate}%</span>
            </div>

            <div className="space-y-0.5">
              <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">My Progress</span>
              <h4 className="text-xs font-bold text-black flex items-center gap-1">
                {completionRate >= 80 ? 'Exceptional workflow! 🚀' : completionRate >= 50 ? 'Great progress! Keep it up! 🚀' : 'Keep pushing forward! 🚀'}
              </h4>
              <span className="text-[9px] text-emerald-500 font-semibold flex items-center">
                ↑ 13% from last week
              </span>
            </div>
          </div>

        </motion.div>

      </div>

      {/* Bottom Grid Section (3 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bottom Col 1: Recent Projects (Category Stats) */}
        <motion.div variants={slideUp} className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-bold text-sm text-black">Category Progress</h3>
            <span onClick={() => navigate('/dashboard/tasks')} className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer">View all</span>
          </div>

          <div className="space-y-3.5 min-h-[160px] flex flex-col justify-start">
            {getCategoryStats().length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <FolderOpen className="w-8 h-8 text-zinc-300 mb-2" />
                <p className="text-[10px] text-zinc-400 font-light">No category tasks yet.</p>
                <p className="text-[9px] text-zinc-400 font-light">Create tasks to track progress!</p>
              </div>
            ) : (
              getCategoryStats().map((item) => (
                <div key={item.label} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded ${item.iconBg} flex items-center justify-center text-[10px] font-bold`}>
                        {item.icon}
                      </div>
                      <span className="font-bold text-zinc-700">{item.label} Tasks</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-semibold font-mono">{item.pct}%</span>
                  </div>
                  <div className="w-full h-1 bg-zinc-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.bgClass} rounded-full`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Bottom Col 2: Upcoming Deadlines */}
        <motion.div variants={slideUp} className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-bold text-sm text-black">Upcoming Deadlines</h3>
            <span onClick={() => navigate('/dashboard/tasks')} className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer">View all</span>
          </div>

          <div className="space-y-3 min-h-[160px] flex flex-col justify-start">
            {getDeadlineTasks().length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <CalendarIcon className="w-8 h-8 text-zinc-300 mb-2" />
                <p className="text-[10px] text-zinc-400 font-light">No active upcoming deadlines.</p>
                <p className="text-[9px] text-zinc-455 font-light">You're all caught up!</p>
              </div>
            ) : (
              getDeadlineTasks().map((task) => {
                const dateMeta = formatDateHeader(task.dueDate);
                const daysLeft = getDaysLeftText(task.dueDate);
                const isOverdue = daysLeft === 'Overdue';
                return (
                  <div key={task._id} className="flex items-center justify-between text-xs p-1">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center font-bold shrink-0 border ${
                        isOverdue 
                          ? 'bg-red-50 border-red-100 text-red-500' 
                          : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                      }`}>
                        <span className="text-[8px] uppercase tracking-wider -mb-0.5">{dateMeta.month}</span>
                        <span className="text-sm">{dateMeta.day}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-800 line-clamp-1">{task.title}</h4>
                        <span className="text-[10px] text-zinc-400 font-light uppercase tracking-wide">{task.category}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      isOverdue 
                        ? 'text-red-500 bg-red-50' 
                        : 'text-zinc-650 bg-zinc-100'
                    }`}>{daysLeft}</span>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Bottom Col 3: Activity Feed */}
        <motion.div variants={slideUp} className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-bold text-sm text-black">Activity Feed</h3>
            <span className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer">View all</span>
          </div>

          <div className="space-y-4 mt-2 min-h-[160px] flex flex-col justify-start">
            {activities.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <Activity className="w-8 h-8 text-zinc-300 mb-2 animate-pulse-slow" />
                <p className="text-[10px] text-zinc-400 font-light">No recent activity.</p>
                <p className="text-[9px] text-zinc-400 font-light">Your actions will be logged here.</p>
              </div>
            ) : (
              activities.slice(0, 4).map((activity) => {
                const actionLabel = activity.action.startsWith('task_') ? 'TS' : activity.action.startsWith('user_') ? 'US' : 'AC';
                const actionBg = activity.action.includes('delete') ? 'bg-red-500/10 text-red-500' : activity.action.includes('create') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-500';
                return (
                  <div key={activity._id} className="flex items-start gap-3 text-xs leading-normal">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${actionBg}`}>
                      {actionLabel}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-zinc-700 font-medium">
                        {activity.details}
                      </p>
                    </div>
                    <span className="text-[9px] text-zinc-400 font-mono font-medium shrink-0 pt-0.5">
                      {timeAgo(activity.createdAt)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

      </div>

    </motion.div>
  );
};

export default DashboardPage;
