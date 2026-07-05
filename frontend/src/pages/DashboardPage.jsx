import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Pause,
  RotateCcw,
  Timer,
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

  const renderAssigneeAvatar = (task) => {
    const assignee = task.assignee;
    const hasAssignee = assignee && (assignee.name || assignee.email);

    return (
      <div 
        className="w-5.5 h-5.5 rounded-full bg-indigo-50 border border-zinc-150 overflow-hidden flex items-center justify-center font-bold text-indigo-600 text-[8px] shrink-0"
        title={hasAssignee ? `Assigned to: ${assignee.name || assignee.email}` : 'Unassigned'}
      >
        {hasAssignee ? (
          assignee.avatar ? (
            <img src={assignee.avatar} alt={assignee.name} className="w-full h-full object-cover" />
          ) : (
            assignee.name 
              ? assignee.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() 
              : (assignee.email || '').slice(0, 2).toUpperCase()
          )
        ) : (
          <svg className="w-2.5 h-2.5 text-zinc-350" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )}
      </div>
    );
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

  // =============================================
  // FOCUS MODE — Real Pomodoro Timer
  // =============================================
  const FOCUS_PRESETS = [
    { label: 'Focus', minutes: 25 },
    { label: 'Short Break', minutes: 5 },
    { label: 'Long Break', minutes: 15 }
  ];
  const [focusPreset, setFocusPreset] = useState(0);
  const [focusSecondsLeft, setFocusSecondsLeft] = useState(FOCUS_PRESETS[0].minutes * 60);
  const [focusRunning, setFocusRunning] = useState(false);
  const [focusTotalSessions, setFocusTotalSessions] = useState(0);
  const focusIntervalRef = useRef(null);

  const focusTotalSeconds = FOCUS_PRESETS[focusPreset].minutes * 60;
  const focusProgress = ((focusTotalSeconds - focusSecondsLeft) / focusTotalSeconds) * 100;
  const focusDashArray = 2 * Math.PI * 62; // circumference for r=62
  const focusDashOffset = focusDashArray - (focusDashArray * focusProgress) / 100;

  const formatTimer = (totalSec) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (focusRunning && focusSecondsLeft > 0) {
      focusIntervalRef.current = setInterval(() => {
        setFocusSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(focusIntervalRef.current);
            setFocusRunning(false);
            setFocusTotalSessions(s => s + 1);
            toast.success(`${FOCUS_PRESETS[focusPreset].label} session complete! 🎉`);
            // Play a subtle notification sound
            try {
              const ctx = new (window.AudioContext || window.webkitAudioContext)();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain); gain.connect(ctx.destination);
              osc.frequency.value = 800; gain.gain.value = 0.3;
              osc.start(); osc.stop(ctx.currentTime + 0.3);
            } catch (e) {}
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(focusIntervalRef.current);
  }, [focusRunning, focusPreset]);

  const handleFocusToggle = () => {
    if (focusSecondsLeft === 0) {
      // Reset and start
      setFocusSecondsLeft(FOCUS_PRESETS[focusPreset].minutes * 60);
      setFocusRunning(true);
    } else {
      setFocusRunning(prev => !prev);
    }
  };

  const handleFocusReset = () => {
    clearInterval(focusIntervalRef.current);
    setFocusRunning(false);
    setFocusSecondsLeft(FOCUS_PRESETS[focusPreset].minutes * 60);
  };

  const handleFocusPresetChange = (idx) => {
    clearInterval(focusIntervalRef.current);
    setFocusRunning(false);
    setFocusPreset(idx);
    setFocusSecondsLeft(FOCUS_PRESETS[idx].minutes * 60);
  };

  // =============================================
  // AI SUGGESTIONS — Dynamic data-driven insights
  // =============================================
  const generateSuggestions = useCallback(() => {
    const suggestions = [];
    const now = new Date();
    const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done');
    const highPriorityPending = tasks.filter(t => t.priority === 'high' && t.status !== 'done');
    const todoPending = tasks.filter(t => t.status === 'todo');
    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'done').length;
    const rate = total > 0 ? Math.round((done / total) * 100) : 0;

    // Overdue alert
    if (overdueTasks.length > 0) {
      suggestions.push({
        icon: 'alert',
        color: 'red',
        text: `You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}. Tackle "${overdueTasks[0].title}" first!`
      });
    }

    // High priority guidance
    if (highPriorityPending.length > 0) {
      suggestions.push({
        icon: 'flag',
        color: 'amber',
        text: `${highPriorityPending.length} high-priority task${highPriorityPending.length > 1 ? 's' : ''} pending. Focus on "${highPriorityPending[0].title}" to stay on track.`
      });
    }

    // Productivity insight
    if (rate >= 80) {
      suggestions.push({
        icon: 'trending',
        color: 'emerald',
        text: `Incredible! You've completed ${rate}% of tasks. You're on a productive streak! 🔥`
      });
    } else if (rate >= 40 && rate < 80) {
      suggestions.push({
        icon: 'trending',
        color: 'blue',
        text: `Good progress at ${rate}% completion. Try completing ${Math.min(3, todoPending.length)} more tasks today!`
      });
    } else if (total > 0 && rate < 40) {
      suggestions.push({
        icon: 'lightbulb',
        color: 'amber',
        text: `Your completion rate is ${rate}%. Start with small tasks to build momentum.`
      });
    }

    // Category workload
    const catCounts = {};
    tasks.filter(t => t.status !== 'done').forEach(t => {
      catCounts[t.category || 'general'] = (catCounts[t.category || 'general'] || 0) + 1;
    });
    const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];
    if (topCat && topCat[1] >= 2) {
      suggestions.push({
        icon: 'compass',
        color: 'purple',
        text: `Most of your pending work is in ${topCat[0].charAt(0).toUpperCase() + topCat[0].slice(1)} (${topCat[1]} tasks). Consider batching them.`
      });
    }

    // Upcoming deadline
    const upcoming = tasks.filter(t => t.dueDate && t.status !== 'done' && new Date(t.dueDate) > now)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
    if (upcoming) {
      const diffDays = Math.ceil((new Date(upcoming.dueDate) - now) / (1000 * 60 * 60 * 24));
      if (diffDays <= 2) {
        suggestions.push({
          icon: 'clock',
          color: 'blue',
          text: `"${upcoming.title}" is due ${diffDays === 0 ? 'today' : diffDays === 1 ? 'tomorrow' : 'in 2 days'}. Plan some time for it.`
        });
      }
    }

    // Focus session suggestion
    if (focusTotalSessions === 0 && total > 0) {
      suggestions.push({
        icon: 'coffee',
        color: 'indigo',
        text: 'Try a 25-minute Focus Session to boost deep work on your top task.'
      });
    } else if (focusTotalSessions > 0) {
      suggestions.push({
        icon: 'coffee',
        color: 'emerald',
        text: `You've completed ${focusTotalSessions} focus session${focusTotalSessions > 1 ? 's' : ''} today. Great discipline! 💪`
      });
    }

    // Empty state
    if (suggestions.length === 0) {
      suggestions.push({
        icon: 'sparkle',
        color: 'indigo',
        text: 'Create some tasks to get personalized AI suggestions and productivity insights!'
      });
    }

    return suggestions.slice(0, 4);
  }, [tasks, focusTotalSessions]);

  const aiSuggestions = generateSuggestions();

  const getSuggestionIcon = (icon, colorClass) => {
    const iconMap = {
      alert: <AlertCircle className={`w-4 h-4 ${colorClass} mt-0.5 shrink-0`} />,
      flag: <Flag className={`w-4 h-4 ${colorClass} mt-0.5 shrink-0`} />,
      trending: <TrendingUp className={`w-4 h-4 ${colorClass} mt-0.5 shrink-0`} />,
      lightbulb: <Lightbulb className={`w-4 h-4 ${colorClass} mt-0.5 shrink-0`} />,
      compass: <Compass className={`w-4 h-4 ${colorClass} mt-0.5 shrink-0`} />,
      clock: <Clock className={`w-4 h-4 ${colorClass} mt-0.5 shrink-0`} />,
      coffee: <Coffee className={`w-4 h-4 ${colorClass} mt-0.5 shrink-0`} />,
      sparkle: <Sparkles className={`w-4 h-4 ${colorClass} mt-0.5 shrink-0`} />,
    };
    return iconMap[icon] || <Lightbulb className={`w-4 h-4 ${colorClass} mt-0.5 shrink-0`} />;
  };

  const getSuggestionStyles = (color) => {
    const styles = {
      red: { bg: 'bg-red-50/50 dark:bg-red-500/10', border: 'border-red-100/40 dark:border-red-500/20', iconColor: 'text-red-500', textColor: 'text-red-800 dark:text-red-300' },
      amber: { bg: 'bg-amber-50/50 dark:bg-amber-500/10', border: 'border-amber-100/40 dark:border-amber-500/20', iconColor: 'text-amber-500', textColor: 'text-amber-800 dark:text-amber-300' },
      blue: { bg: 'bg-blue-50/50 dark:bg-blue-500/10', border: 'border-blue-100/40 dark:border-blue-500/20', iconColor: 'text-blue-500', textColor: 'text-blue-800 dark:text-blue-300' },
      emerald: { bg: 'bg-emerald-50/50 dark:bg-emerald-500/10', border: 'border-emerald-100/40 dark:border-emerald-500/20', iconColor: 'text-emerald-500', textColor: 'text-emerald-800 dark:text-emerald-300' },
      purple: { bg: 'bg-purple-50/50 dark:bg-purple-500/10', border: 'border-purple-100/40 dark:border-purple-500/20', iconColor: 'text-purple-500', textColor: 'text-purple-800 dark:text-purple-300' },
      indigo: { bg: 'bg-indigo-50/50 dark:bg-indigo-500/10', border: 'border-indigo-100/40 dark:border-indigo-500/20', iconColor: 'text-indigo-500', textColor: 'text-indigo-800 dark:text-indigo-300' },
    };
    return styles[color] || styles.blue;
  };

  // Dynamic calendar generator for current month
  const generateCalendarDays = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const days = [];

    // Previous month trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: daysInPrevMonth - i, mock: true });
    }
    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ day: d, active: d === today });
    }
    // Next month leading days to fill grid to 35 or 42
    const remaining = days.length <= 35 ? 35 - days.length : 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push({ day: d, mock: true });
    }
    return days;
  };

  const calendarDays = generateCalendarDays();
  const calendarMonthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

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
                      <div className="flex items-center gap-2 shrink-0 text-zinc-400 pl-2">
                        {renderAssigneeAvatar(task)}
                        <div className="flex items-center gap-1 font-mono text-[10px]">
                          {isHigh && <Flag className="w-3 h-3 text-red-500 fill-red-500" />}
                          <span>{task.dueDate ? new Date(task.dueDate).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'}) : ''}</span>
                        </div>
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

        {/* Panel 2: Focus Mode — Real Pomodoro Timer */}
        <motion.div variants={slideUp} className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm flex flex-col justify-between min-h-[360px] relative overflow-hidden">
          
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-sm text-black">Focus Mode</h3>
                <span className="text-[10px] text-zinc-400 font-light">Improve your concentration</span>
              </div>
              {focusTotalSessions > 0 && (
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  {focusTotalSessions} done
                </span>
              )}
            </div>

            {/* Preset tabs */}
            <div className="flex gap-1.5 mt-3">
              {FOCUS_PRESETS.map((p, idx) => (
                <button
                  key={p.label}
                  onClick={() => handleFocusPresetChange(idx)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    focusPreset === idx
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Circular Progress Timer */}
          <div className="relative flex flex-col items-center justify-center z-10 py-2">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r="62" fill="none" stroke="currentColor" strokeWidth="6" className="text-zinc-100 dark:text-zinc-800" />
                <circle 
                  cx="70" cy="70" r="62" fill="none" 
                  stroke="url(#focusGradient)" 
                  strokeWidth="6" 
                  strokeLinecap="round"
                  strokeDasharray={focusDashArray}
                  strokeDashoffset={focusDashOffset}
                  className="transition-all duration-1000 ease-linear"
                />
                <defs>
                  <linearGradient id="focusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display font-extrabold text-2xl text-black tracking-tight">
                  {formatTimer(focusSecondsLeft)}
                </span>
                <span className="text-[9px] text-zinc-400 font-medium mt-0.5">
                  {FOCUS_PRESETS[focusPreset].label}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={handleFocusReset}
                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 transition-colors cursor-pointer"
                title="Reset"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleFocusToggle}
                className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg border border-white/20 cursor-pointer transition-all ${
                  focusRunning 
                    ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30' 
                    : 'bg-[#5045e4] hover:bg-indigo-600 shadow-indigo-600/35'
                }`}
              >
                {focusRunning 
                  ? <Pause className="w-4 h-4 text-white fill-white" /> 
                  : <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                }
              </button>
            </div>
          </div>

          {/* Bottom wave decoration */}
          <div className="absolute bottom-0 inset-x-0 h-12 pointer-events-none z-0">
            <svg className="w-full h-full text-indigo-50 dark:text-indigo-950/30" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path d="M0,25 C30,15 60,35 100,20 L100,30 L0,30 Z" fill="currentColor" opacity="0.3" />
              <path d="M0,20 C40,30 70,10 100,25 L100,30 L0,30 Z" fill="currentColor" opacity="0.5" />
            </svg>
          </div>

        </motion.div>

        {/* Panel 3: AI Suggestions — Data-driven insights */}
        <motion.div variants={slideUp} className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm flex flex-col justify-between min-h-[360px]">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <h3 className="font-display font-bold text-sm text-black">AI Suggestions</h3>
            </div>
            <span className="text-[10px] text-zinc-400 font-light">Nova has some ideas for you</span>

            {/* Dynamic suggestion cards */}
            <div className="space-y-2.5 mt-4">
              {aiSuggestions.map((suggestion, idx) => {
                const styles = getSuggestionStyles(suggestion.color);
                return (
                  <div key={idx} className={`p-3 rounded-xl ${styles.bg} border ${styles.border} flex items-start gap-2.5`}>
                    {getSuggestionIcon(suggestion.icon, styles.iconColor)}
                    <p className={`text-[10px] ${styles.textColor} leading-normal font-medium`}>
                      {suggestion.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-50 dark:border-zinc-800">
            <button 
              onClick={() => navigate('/dashboard/tasks')}
              className="text-xs font-bold text-indigo-600 flex items-center gap-1.5 cursor-pointer hover:text-indigo-500 transition-colors"
            >
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
                <span className="text-[10px] text-zinc-400 font-semibold font-mono">{calendarMonthLabel}</span>
                <div className="flex gap-1">
                  <button className="p-0.5 rounded border border-zinc-100 hover:bg-zinc-50 text-zinc-400"><ChevronLeft className="w-3 h-3" /></button>
                  <button className="p-0.5 rounded border border-zinc-100 hover:bg-zinc-50 text-zinc-400"><ChevronRightIcon className="w-3 h-3" /></button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-7 text-center text-[9px] text-zinc-400 font-bold border-b border-zinc-50 dark:border-zinc-800 pb-1.5">
              <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
            </div>

            <div className="grid grid-cols-7 text-center gap-y-1.5 text-[9px] font-semibold">
              {calendarDays.map((d, i) => (
                <div key={i} className="flex justify-center items-center">
                  <span className={`w-5 h-5 flex items-center justify-center rounded-full ${
                    d.active ? 'bg-indigo-600 text-white shadow-md' :
                    d.mock ? 'text-zinc-300 dark:text-zinc-600 font-light' : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
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
                    <div className="flex items-center gap-3">
                      {renderAssigneeAvatar(task)}
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        isOverdue 
                          ? 'text-red-500 bg-red-50' 
                          : 'text-zinc-650 bg-zinc-100'
                      }`}>{daysLeft}</span>
                    </div>
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
