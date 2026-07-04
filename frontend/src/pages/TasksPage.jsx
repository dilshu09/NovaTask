import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  SlidersHorizontal, 
  ArrowUpDown, 
  Flag, 
  Check, 
  X, 
  ChevronRight,
  TrendingUp,
  LayoutGrid,
  FileCode,
  Layers,
  FileText,
  Users2,
  Sparkles,
  Calendar,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { slideUp, staggerContainer, fadeIn } from '../animations/motion';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../contexts/AuthContext';


const TasksPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, settings, inviteMember } = useAuth();
  const members = settings?.members || [];

  // Tasks Data States
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All Tasks'); // All Tasks, To Do, In Progress, Completed, High Priority
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');

  // Assignee selection state (multi-member)
  const [formAssignees, setFormAssignees] = useState([]);
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterOwnership, setFilterOwnership] = useState('all'); // 'all' | 'personal' | 'collaborative'

  // Form Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formStatus, setFormStatus] = useState('todo');
  const [formPriority, setFormPriority] = useState('medium');
  const [formCategory, setFormCategory] = useState('general');
  const [formDueDate, setFormDueDate] = useState('');
  const [formProject, setFormProject] = useState('General');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'board'
  const [dragOverCol, setDragOverCol] = useState(null); // 'todo' | 'in_progress' | 'done' | null

  // Summary counts state derived from database tasks
  const [counts, setCounts] = useState({ todo: 0, progress: 0, completed: 0, high: 0 });

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks');
      const list = res.data.data || [];
      setTasks(list);

      // Compute statistics dynamically from real database tasks
      const todo = list.filter(t => t.status === 'todo').length;
      const progress = list.filter(t => t.status === 'in_progress').length;
      const completed = list.filter(t => t.status === 'done').length;
      const high = list.filter(t => t.priority === 'high' && t.status !== 'done').length;
      setCounts({ todo, progress, completed, high });
    } catch (error) {
      toast.error('Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate dynamic category counts from real database tasks
  const getCategoryCounts = () => {
    const categories = ['development', 'design', 'marketing', 'finance', 'operations', 'general'];
    return categories.map(cat => {
      const count = tasks.filter(t => t.category === cat).length;
      let label = cat.charAt(0).toUpperCase() + cat.slice(1);
      let icon = <Layers className="w-4 h-4 text-zinc-500" />;
      let bg = 'bg-zinc-100/50';
      if (cat === 'development') { icon = <FileCode className="w-4 h-4 text-purple-500" />; bg = 'bg-purple-50'; }
      else if (cat === 'design') { icon = <Sparkles className="w-4 h-4 text-blue-500" />; bg = 'bg-blue-50'; }
      else if (cat === 'marketing') { icon = <TrendingUp className="w-4 h-4 text-emerald-500" />; bg = 'bg-emerald-50'; }
      else if (cat === 'finance') { icon = <FileText className="w-4 h-4 text-amber-500" />; bg = 'bg-amber-50'; }
      else if (cat === 'operations') { icon = <Users2 className="w-4 h-4 text-zinc-500" />; bg = 'bg-zinc-100'; }
      else if (cat === 'general') { icon = <Layers className="w-4 h-4 text-indigo-500" />; bg = 'bg-indigo-50'; }
      return { label, count, icon, bg };
    }).filter(item => item.count > 0);
  };

  // Productivity Score Calculation
  const productivityScore = tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0;
  const productivityLabel = productivityScore >= 80 ? 'Exceptional' : productivityScore >= 50 ? 'Good' : productivityScore > 0 ? 'Improving' : 'Get Started';
  const dashOffset = 126 - (126 * productivityScore) / 100;

  // Donut chart segments helper variables
  const totalTasks = tasks.length;
  const completedPct = totalTasks > 0 ? (counts.completed / totalTasks) * 100 : 0;
  const progressPct = totalTasks > 0 ? (counts.progress / totalTasks) * 100 : 0;
  const todoPct = totalTasks > 0 ? (counts.todo / totalTasks) * 100 : 0;

  useEffect(() => {
    fetchTasks();
  }, []);

  // Sync vocal trigger updates
  useEffect(() => {
    const handleVoiceMutation = () => {
      fetchTasks();
    };
    const handleOpenModal = () => {
      openCreateModal();
    };
    window.addEventListener('task_created_via_voice', handleVoiceMutation);
    window.addEventListener('open_task_modal_via_voice', handleOpenModal);
    return () => {
      window.removeEventListener('task_created_via_voice', handleVoiceMutation);
      window.removeEventListener('open_task_modal_via_voice', handleOpenModal);
    };
  }, []);

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      openCreateModal();
    }
  }, [searchParams]);

  const toggleTaskDone = async (task) => {
    const nextStatus = task.status === 'done' ? 'todo' : 'done';
    
    // Optimistic UI update
    setTasks(prev => 
      prev.map(t => t._id === task._id ? { ...t, status: nextStatus } : t)
    );

    try {
      await api.put(`/tasks/${task._id}`, { status: nextStatus });
      toast.success('Task updated successfully');
      fetchTasks();
    } catch (e) {
      toast.error('Failed to update task');
      fetchTasks();
    }
  };

  const openCreateModal = () => {
    setFormTitle('');
    setFormDesc('');
    setFormStatus('todo');
    setFormPriority('medium');
    setFormCategory('general');
    setFormDueDate('');
    setFormProject('General');
    setFormAssignees([]);
    setEditingTaskId(null);
    setIsModalOpen(true);
    if (searchParams.get('create') === 'true') {
      setSearchParams({}, { replace: true });
    }
  };

  const openEditModal = (task) => {
    setEditingTaskId(task._id);
    setFormTitle(task.title || '');
    setFormDesc(task.description || '');
    setFormStatus(task.status || 'todo');
    setFormPriority(task.priority || 'medium');
    setFormCategory(task.category || 'general');
    setFormProject(task.description || 'General');
    setFormAssignees(task.assignees || (task.assignee && (task.assignee.name || task.assignee.email) ? [task.assignee] : []));
    
    if (task.dueDate) {
      const d = new Date(task.dueDate);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      setFormDueDate(`${year}-${month}-${day}T${hours}:${minutes}`);
    } else {
      setFormDueDate('');
    }
    setIsModalOpen(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error('Task title is required');
      return;
    }

    const payload = {
      title: formTitle,
      status: formStatus,
      priority: formPriority,
      category: formCategory,
      dueDate: formDueDate ? new Date(formDueDate).toISOString() : null,
      description: formProject,
      assignees: formAssignees.length > 0 ? formAssignees : [],
      assignee: formAssignees.length === 1 ? formAssignees[0] : (formAssignees.length > 0 ? formAssignees[0] : null)
    };

    try {
      if (editingTaskId) {
        await api.put(`/tasks/${editingTaskId}`, payload);
        toast.success('Task updated successfully');
      } else {
        await api.post('/tasks', payload);
        toast.success('Task created successfully');
      }
      setIsModalOpen(false);
      fetchTasks();
    } catch (err) {
      toast.error('Failed to save task');
    }
  };

  const handleDeleteTask = (id) => {
    setTaskToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    try {
      await api.delete(`/tasks/${taskToDelete}`);
      toast.success('Task deleted successfully');
      fetchTasks();
    } catch (err) {
      toast.error('Failed to delete task');
    } finally {
      setTaskToDelete(null);
    }
  };

  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e, col) => {
    e.preventDefault();
    if (dragOverCol !== col) {
      setDragOverCol(col);
    }
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;

    // Optimistic status update
    const originalTasks = [...tasks];
    setTasks(prev => 
      prev.map(t => t._id === id ? { ...t, status: targetStatus } : t)
    );

    try {
      await api.put(`/tasks/${id}`, { status: targetStatus });
      toast.success('Task moved successfully');
      fetchTasks();
    } catch (err) {
      setTasks(originalTasks);
      toast.error('Failed to move task');
    }
  };

  // Filter Tasks list based on active sub tab
  const getFilteredTasks = () => {
    let list = [...tasks];

    // Apply Tab filter
    if (activeTab === 'To Do') {
      list = list.filter(t => t.status === 'todo');
    } else if (activeTab === 'In Progress') {
      list = list.filter(t => t.status === 'in_progress');
    } else if (activeTab === 'Completed') {
      list = list.filter(t => t.status === 'done');
    } else if (activeTab === 'High Priority') {
      list = list.filter(t => t.priority === 'high');
    }

    // Apply Priority dropdown filter
    if (filterPriority !== 'all') {
      list = list.filter(t => t.priority === filterPriority);
    }

    // Apply Category dropdown filter
    if (filterCategory !== 'all') {
      list = list.filter(t => t.category === filterCategory);
    }

    // Apply Assignee dropdown filter
    if (filterAssignee !== 'all') {
      if (filterAssignee === 'unassigned') {
        list = list.filter(t => {
          const hasAssignee = t.assignee && (t.assignee.name || t.assignee.email);
          const hasAssignees = t.assignees && t.assignees.length > 0;
          return !hasAssignee && !hasAssignees;
        });
      } else {
        list = list.filter(t => {
          const matchSingle = t.assignee && t.assignee.email?.toLowerCase() === filterAssignee.toLowerCase();
          const matchMulti = t.assignees && t.assignees.some(a => a.email?.toLowerCase() === filterAssignee.toLowerCase());
          return matchSingle || matchMulti;
        });
      }
    }

    // Apply Ownership filter (personal vs collaborative)
    if (filterOwnership === 'personal') {
      list = list.filter(t => {
        const hasAssignee = t.assignee && (t.assignee.name || t.assignee.email);
        const hasAssignees = t.assignees && t.assignees.length > 0;
        return !hasAssignee && !hasAssignees;
      });
    } else if (filterOwnership === 'collaborative') {
      list = list.filter(t => {
        const hasAssignee = t.assignee && (t.assignee.name || t.assignee.email);
        const hasAssignees = t.assignees && t.assignees.length > 0;
        return hasAssignee || hasAssignees;
      });
    }

    // Apply Search filter
    const searchQ = searchParams.get('search') || '';
    if (searchQ) {
      const q = searchQ.toLowerCase();
      list = list.filter(t => 
        t.title.toLowerCase().includes(q) || 
        (t.description && t.description.toLowerCase().includes(q))
      );
    }

    // Apply Sorting
    list.sort((a, b) => {
      if (sortBy === 'dueDate_asc') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      if (sortBy === 'dueDate_desc') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(b.dueDate) - new Date(a.dueDate);
      }
      if (sortBy === 'priority_highToLow') {
        const weight = { high: 3, medium: 2, low: 1 };
        return (weight[b.priority] || 0) - (weight[a.priority] || 0);
      }
      if (sortBy === 'priority_lowToHigh') {
        const weight = { high: 3, medium: 2, low: 1 };
        return (weight[a.priority] || 0) - (weight[b.priority] || 0);
      }
      if (sortBy === 'title_az') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'title_za') {
        return b.title.localeCompare(a.title);
      }
      // default: createdAt desc (newest first)
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    return list;
  };

  // Split tasks into Today and Tomorrow lists
  const filteredList = getFilteredTasks();
  
  const getColomboDayString = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { timeZone: "Asia/Colombo", year: 'numeric', month: 'numeric', day: 'numeric' });
  };

  const todayStr = getColomboDayString(new Date());
  
  const tom = new Date();
  tom.setDate(tom.getDate() + 1);
  const tomorrowStr = getColomboDayString(tom);

  const todayTasks = filteredList.filter(t => {
    if (!t.dueDate) return true;
    const dueStr = getColomboDayString(t.dueDate);
    return dueStr === todayStr || (new Date(t.dueDate) < new Date() && t.status !== 'done');
  });

  const tomorrowTasks = filteredList.filter(t => {
    if (!t.dueDate) return false;
    const dueStr = getColomboDayString(t.dueDate);
    return dueStr === tomorrowStr;
  });

  const upcomingTasks = filteredList.filter(t => {
    if (!t.dueDate) return false;
    const dueStr = getColomboDayString(t.dueDate);
    return dueStr !== todayStr && dueStr !== tomorrowStr && new Date(t.dueDate) > new Date();
  });

  const renderAssigneeAvatar = (task, size = 'medium') => {
    const assignee = task.assignee;
    const isSmall = size === 'small';
    const classes = isSmall
      ? "w-6 h-6 text-[8px]"
      : "w-7 h-7 text-[9px]";
    const iconSize = isSmall ? "w-3" : "w-3.5";

    const hasAssignee = assignee && (assignee.name || assignee.email);

    return (
      <div 
        className={`rounded-full bg-indigo-50 border border-zinc-150 overflow-hidden flex items-center justify-center font-bold text-indigo-600 shrink-0 ${classes}`}
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
          <svg className={`${iconSize} text-zinc-350`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )}
      </div>
    );
  };

  const getPriorityBadge = (priority) => {
    if (priority === 'high') {
      return (
        <span className="flex items-center gap-1 text-red-500 font-bold text-[10px]">
          <Flag className="w-3.5 h-3.5 fill-red-500" />
          High
        </span>
      );
    }
    if (priority === 'medium') {
      return (
        <span className="flex items-center gap-1 text-amber-500 font-bold text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Medium
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-blue-500 font-bold text-[10px]">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        Low
      </span>
    );
  };

  const getCategoryColor = (cat) => {
    const colors = {
      design: 'bg-blue-50 text-blue-600 border-blue-100',
      'ui/ux': 'bg-blue-50 text-blue-600 border-blue-100',
      backend: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      development: 'bg-purple-50 text-purple-600 border-purple-100',
      meeting: 'bg-zinc-100 text-zinc-600 border-zinc-200',
      content: 'bg-amber-50 text-amber-600 border-amber-100',
      analytics: 'bg-emerald-50 text-emerald-600 border-emerald-100'
    };
    return colors[cat.toLowerCase()] || 'bg-zinc-100 text-zinc-600';
  };

  return (
    <div className="space-y-6 relative min-h-screen text-zinc-700">
      
      {/* Title Header with Workspace Members Stack */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-display font-extrabold text-black tracking-tight">My Tasks</h1>
          <p className="text-zinc-400 text-xs font-light">Manage and organize your tasks efficiently.</p>
        </div>

        {/* Team Members Avatar Stack */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider hidden sm:inline mr-1">Workspace Team:</span>
          
          <div className="flex -space-x-2.5 overflow-hidden">
            {members.map((m, idx) => {
              const nameInitials = m.name 
                ? m.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() 
                : (m.email || '').slice(0, 2).toUpperCase();
              
              return (
                <div 
                  key={m.email} 
                  className="w-8.5 h-8.5 rounded-full border-2 border-white overflow-hidden bg-indigo-50 flex items-center justify-center font-bold text-indigo-600 text-[10px] shrink-0 shadow-sm transition-transform hover:scale-105"
                  title={`${m.name || m.email} (${m.role})`}
                  style={{ zIndex: 30 - idx }}
                >
                  {m.avatar ? (
                    <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                  ) : (
                    nameInitials
                  )}
                </div>
              );
            })}
          </div>

          {/* Invite Member Popup Button */}
          <div className="relative">
            <button
              onClick={() => setIsInviteOpen(!isInviteOpen)}
              className="w-8.5 h-8.5 rounded-full border border-dashed border-zinc-300 hover:border-indigo-500 hover:bg-indigo-50/30 flex items-center justify-center text-zinc-400 hover:text-indigo-600 transition-all cursor-pointer shadow-sm shrink-0"
              title="Invite team member"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Invite Popover Form */}
            {isInviteOpen && (
              <>
                <div className="fixed inset-0 z-35" onClick={() => setIsInviteOpen(false)} />
                <div className="absolute right-0 mt-2 w-72 bg-white border border-zinc-150 rounded-2xl shadow-xl p-4.5 z-40 space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-black">Invite Collaborator</h4>
                    <p className="text-[10px] text-zinc-400 font-light">Add a team member to this workspace.</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wide">Full Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. John Doe"
                        value={inviteName}
                        onChange={(e) => setInviteName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wide">Email Address</label>
                      <input 
                        type="email" 
                        placeholder="john@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wide">Role</label>
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none cursor-pointer"
                      >
                         <option value="editor">Editor</option>
                         <option value="admin">Admin</option>
                         <option value="viewer">Viewer</option>
                      </select>
                    </div>

                    <button
                      onClick={async () => {
                        if (!inviteEmail.trim()) {
                          toast.error('Email is required');
                          return;
                        }
                        const res = await inviteMember(inviteEmail, inviteName, inviteRole);
                        if (res.success) {
                          setInviteEmail('');
                          setInviteName('');
                          setIsInviteOpen(false);
                        }
                      }}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/10 transition-colors cursor-pointer"
                    >
                      Invite Member
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-100 pb-1.5">
        
        {/* Tabs selector */}
        <div className="flex flex-wrap items-center gap-6 text-xs font-bold text-zinc-400 shrink-0">
          {[
            { label: 'All Tasks', count: counts.todo + counts.progress + counts.completed },
            { label: 'To Do', count: counts.todo },
            { label: 'In Progress', count: counts.progress },
            { label: 'Completed', count: counts.completed },
            { label: 'High Priority', count: counts.high }
          ].map((tab) => {
            const isActive = activeTab === tab.label;
            return (
              <button
                key={tab.label}
                onClick={() => setActiveTab(tab.label)}
                className={`pb-3.5 relative flex items-center gap-1.5 cursor-pointer transition-colors ${
                  isActive ? 'text-indigo-600' : 'hover:text-zinc-600'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                  isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-zinc-100 text-zinc-500'
                }`}>
                  {tab.count}
                </span>
                {isActive && (
                  <motion.div 
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 inset-x-0 h-0.5 bg-indigo-600"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Buttons filters */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {/* Segmented layout switcher control */}
          <div className="bg-zinc-100 p-0.5 rounded-xl flex items-center gap-0.5 border border-zinc-200/50 mr-1.5">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center justify-center cursor-pointer transition-all ${
                viewMode === 'list' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
              title="List View"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center justify-center cursor-pointer transition-all ${
                viewMode === 'board' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
              title="Board View"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h3a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h3a1 1 0 011 1v4a1 1 0 01-1 1h-3a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h3a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h3a1 1 0 011 1v4a1 1 0 01-1 1h-3a1 1 0 01-1-1v-4z" />
              </svg>
            </button>
          </div>

          <div className="relative">
            <button 
              onClick={() => {
                setIsFilterDropdownOpen(!isFilterDropdownOpen);
                setIsSortDropdownOpen(false);
              }}
              className={`px-3.5 py-2 bg-white border rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                isFilterDropdownOpen 
                  ? 'border-indigo-500 text-indigo-600 bg-indigo-50/20' 
                  : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              {(filterPriority !== 'all' || filterCategory !== 'all' || filterAssignee !== 'all' || filterOwnership !== 'all') && (
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              )}
            </button>
            
            {/* Filter Dropdown Menu */}
            {isFilterDropdownOpen && (
              <>
                <div className="fixed inset-0 z-35" onClick={() => setIsFilterDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white border border-zinc-150 rounded-2xl shadow-xl p-4 z-40 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Priority</label>
                    <select
                      value={filterPriority}
                      onChange={(e) => setFilterPriority(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 focus:outline-none cursor-pointer"
                    >
                      <option value="all">All Priorities</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Category</label>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 focus:outline-none cursor-pointer"
                    >
                      <option value="all">All Categories</option>
                      <option value="general">General</option>
                      <option value="design">Design</option>
                      <option value="development">Development</option>
                      <option value="backend">Backend</option>
                      <option value="content">Content</option>
                      <option value="meeting">Meeting</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Assignee</label>
                    <select
                      value={filterAssignee}
                      onChange={(e) => setFilterAssignee(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 focus:outline-none cursor-pointer"
                    >
                      <option value="all">All Assignees</option>
                      <option value="unassigned">Unassigned</option>
                      {members.map(m => (
                        <option key={m.email} value={m.email}>{m.name || m.email}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Task Type</label>
                    <select
                      value={filterOwnership}
                      onChange={(e) => setFilterOwnership(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 focus:outline-none cursor-pointer"
                    >
                      <option value="all">All Tasks</option>
                      <option value="personal">Personal Tasks</option>
                      <option value="collaborative">Collaborative Tasks</option>
                    </select>
                  </div>
                  {(filterPriority !== 'all' || filterCategory !== 'all' || filterAssignee !== 'all' || filterOwnership !== 'all') && (
                    <button
                      onClick={() => {
                        setFilterPriority('all');
                        setFilterCategory('all');
                        setFilterAssignee('all');
                        setFilterOwnership('all');
                        setIsFilterDropdownOpen(false);
                      }}
                      className="w-full py-1.5 bg-zinc-100 hover:bg-zinc-200/70 text-zinc-600 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="relative">
            <button 
              onClick={() => {
                setIsSortDropdownOpen(!isSortDropdownOpen);
                setIsFilterDropdownOpen(false);
              }}
              className={`px-3.5 py-2 bg-white border rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                isSortDropdownOpen 
                  ? 'border-indigo-500 text-indigo-600 bg-indigo-50/20' 
                  : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              Sort
            </button>
            
            {/* Sort Dropdown Menu */}
            {isSortDropdownOpen && (
              <>
                <div className="fixed inset-0 z-35" onClick={() => setIsSortDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-zinc-150 rounded-2xl shadow-xl py-2 z-40">
                  {[
                    { value: 'createdAt', label: 'Recently Created' },
                    { value: 'dueDate_asc', label: 'Due Date (Earliest)' },
                    { value: 'dueDate_desc', label: 'Due Date (Latest)' },
                    { value: 'priority_highToLow', label: 'Priority (High to Low)' },
                    { value: 'priority_lowToHigh', label: 'Priority (Low to High)' },
                    { value: 'title_az', label: 'Alphabetical (A-Z)' },
                    { value: 'title_za', label: 'Alphabetical (Z-A)' }
                  ].map((option) => {
                    const isSelected = sortBy === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setIsSortDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-xs font-medium flex items-center justify-between transition-colors hover:bg-zinc-50 cursor-pointer ${
                          isSelected ? 'text-indigo-600 font-bold bg-indigo-50/20' : 'text-zinc-655'
                        }`}
                      >
                        <span>{option.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
          <button 
            onClick={openCreateModal}
            className="px-4 py-2 bg-[#5045e4] hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/10 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            New Task
          </button>
        </div>

      </div>

      {/* Main content splits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Scheduled Groups */}
        {viewMode === 'list' ? (
          /* Left Column: Scheduled Groups (List View) */
          <div className="lg:col-span-8 space-y-8">
            
            {/* Today Group */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-extrabold text-sm text-black flex items-center gap-2">
                  Today
                  <span className="px-2 py-0.5 text-[10px] bg-zinc-100 text-zinc-500 rounded-full font-bold">{todayTasks.length}</span>
                </h3>
                <button className="p-1 rounded hover:bg-zinc-100 text-zinc-400">•••</button>
              </div>

              <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm divide-y divide-zinc-50 overflow-hidden">
                {loading ? (
                  <div className="p-12 text-center text-xs text-zinc-400 animate-pulse">Loading scheduled workloads...</div>
                ) : todayTasks.length > 0 ? (
                  todayTasks.map((t) => {
                    const isDone = t.status === 'done';
                    return (
                      <div key={t._id} className="flex items-center justify-between p-4 hover:bg-zinc-50/50 transition-colors">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <button
                            onClick={() => toggleTaskDone(t)}
                            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                              isDone 
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                                : 'border-zinc-300 hover:border-indigo-500 bg-white'
                            }`}
                          >
                            {isDone && <Check className="w-3.5 h-3.5" />}
                          </button>
                          <div className="min-w-0">
                            <h4 className={`text-xs font-bold text-zinc-800 truncate ${isDone ? 'line-through text-zinc-400 font-light' : ''}`}>
                              {t.title}
                            </h4>
                            <span className="text-[10px] text-zinc-450 font-light flex items-center gap-1.5 mt-0.5">
                              • {t.description || 'General'}
                            </span>
                          </div>
                        </div>

                        {/* Tag, Priority and Time */}
                        <div className="flex items-center gap-6 shrink-0">
                          <div className="w-16 flex justify-start">
                            {getPriorityBadge(t.priority)}
                          </div>

                          <span className="text-[10px] text-zinc-400 font-mono font-medium min-w-[50px] text-right">
                            {t.dueDate ? new Date(t.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'General'}
                          </span>

                          {renderAssigneeAvatar(t)}

                          <div className="flex items-center gap-2 border-l border-zinc-100 pl-3 ml-1.5 shrink-0">
                            <button
                              onClick={() => openEditModal(t)}
                              className="p-1 rounded-lg text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                              title="Edit Task"
                            >
                              <span className="sr-only">Edit</span>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteTask(t._id)}
                              className="p-1 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete Task"
                            >
                              <span className="sr-only">Delete</span>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-12 text-center text-xs text-zinc-400 font-light">No tasks scheduled for today.</div>
                )}
              </div>
            </div>

            {/* Tomorrow Group */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-extrabold text-sm text-black flex items-center gap-2">
                  Tomorrow
                  <span className="px-2 py-0.5 text-[10px] bg-zinc-100 text-zinc-500 rounded-full font-bold">{tomorrowTasks.length}</span>
                </h3>
                <button className="p-1 rounded hover:bg-zinc-100 text-zinc-400">•••</button>
              </div>

              <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm divide-y divide-zinc-50 overflow-hidden">
                {loading ? (
                  <div className="p-12 text-center text-xs text-zinc-400 animate-pulse">Loading tomorrow schedules...</div>
                ) : tomorrowTasks.length > 0 ? (
                  tomorrowTasks.map((t) => {
                    const isDone = t.status === 'done';
                    return (
                      <div key={t._id} className="flex items-center justify-between p-4 hover:bg-zinc-50/50 transition-colors">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <button
                            onClick={() => toggleTaskDone(t)}
                            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                              isDone 
                                ? 'bg-indigo-600 border-indigo-600 text-white' 
                                : 'border-zinc-300 hover:border-indigo-500 bg-white'
                            }`}
                          >
                            {isDone && <Check className="w-3.5 h-3.5" />}
                          </button>
                          <div className="min-w-0">
                            <h4 className={`text-xs font-bold text-zinc-800 truncate ${isDone ? 'line-through text-zinc-400 font-light' : ''}`}>
                              {t.title}
                            </h4>
                            <span className="text-[10px] text-zinc-450 font-light flex items-center gap-1.5 mt-0.5">
                              • {t.description || 'General'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 shrink-0">
                          <div className="w-16 flex justify-start">
                            {getPriorityBadge(t.priority)}
                          </div>

                          <span className="text-[10px] text-zinc-400 font-mono font-medium min-w-[50px] text-right">
                            {new Date(t.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>

                          {renderAssigneeAvatar(t)}

                          <div className="flex items-center gap-2 border-l border-zinc-100 pl-3 ml-1.5 shrink-0">
                            <button
                              onClick={() => openEditModal(t)}
                              className="p-1 rounded-lg text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                              title="Edit Task"
                            >
                              <span className="sr-only">Edit</span>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteTask(t._id)}
                              className="p-1 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete Task"
                            >
                              <span className="sr-only">Delete</span>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-12 text-center text-xs text-zinc-400 font-light">No tasks scheduled for tomorrow.</div>
                )}
              </div>
            </div>

            {/* Upcoming / Scheduled Group */}
            {upcomingTasks.length > 0 && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-extrabold text-sm text-black flex items-center gap-2">
                    Upcoming
                    <span className="px-2 py-0.5 text-[10px] bg-zinc-100 text-zinc-500 rounded-full font-bold">{upcomingTasks.length}</span>
                  </h3>
                </div>

                <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm divide-y divide-zinc-50 overflow-hidden">
                  {upcomingTasks.map((t) => {
                    const isDone = t.status === 'done';
                    return (
                      <div key={t._id} className="flex items-center justify-between p-4 hover:bg-zinc-50/50 transition-colors">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <button
                            onClick={() => toggleTaskDone(t)}
                            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                              isDone 
                                ? 'bg-indigo-600 border-indigo-600 text-white' 
                                : 'border-zinc-300 hover:border-indigo-500 bg-white'
                            }`}
                          >
                            {isDone && <Check className="w-3.5 h-3.5" />}
                          </button>
                          <div className="min-w-0">
                            <h4 className={`text-xs font-bold text-zinc-800 truncate ${isDone ? 'line-through text-zinc-400 font-light' : ''}`}>
                              {t.title}
                            </h4>
                            <span className="text-[10px] text-zinc-450 font-light flex items-center gap-1.5 mt-0.5">
                              • {t.description || 'General'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 shrink-0">
                          <div className="w-16 flex justify-start">
                            {getPriorityBadge(t.priority)}
                          </div>

                          <span className="text-[10px] text-zinc-450 font-mono font-medium min-w-[50px] text-right">
                            {new Date(t.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>

                          {renderAssigneeAvatar(t)}

                          <div className="flex items-center gap-2 border-l border-zinc-100 pl-3 ml-1.5 shrink-0">
                            <button
                              onClick={() => openEditModal(t)}
                              className="p-1 rounded-lg text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                              title="Edit Task"
                            >
                              <span className="sr-only">Edit</span>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteTask(t._id)}
                              className="p-1 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete Task"
                            >
                              <span className="sr-only">Delete</span>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        ) : (
          /* Left Column: Kanban Board (Board View) */
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {[
              { status: 'todo', label: 'To Do', dot: 'bg-zinc-400' },
              { status: 'in_progress', label: 'In Progress', dot: 'bg-blue-500' },
              { status: 'done', label: 'Completed', dot: 'bg-emerald-500' }
            ].map((col) => {
              const colTasks = filteredList.filter(t => t.status === col.status);
              const isOver = dragOverCol === col.status;
              
              return (
                <div 
                  key={col.status} 
                  onDragOver={(e) => handleDragOver(e, col.status)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, col.status)}
                  className={`space-y-4 rounded-2xl p-4 transition-all duration-200 border ${
                    isOver 
                      ? 'bg-indigo-50/40 border-2 border-dashed border-indigo-300 shadow-inner' 
                      : 'bg-zinc-50/50 border-zinc-100 shadow-sm'
                  }`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                      <span className="font-display font-extrabold text-[11px] text-zinc-800 uppercase tracking-wider">{col.label}</span>
                      <span className="px-1.5 py-0.5 text-[9px] bg-zinc-200/60 text-zinc-500 rounded-full font-bold">
                        {colTasks.length}
                      </span>
                    </div>
                  </div>

                  {/* Tasks List Container */}
                  <div className="space-y-3 min-h-[400px]">
                    {colTasks.length > 0 ? (
                      colTasks.map((t) => (
                        <motion.div
                          layout
                          key={t._id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, t._id)}
                          className="bg-white p-4 rounded-xl border border-zinc-150 shadow-sm space-y-3.5 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-zinc-200 transition-all"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1 min-w-0 flex-1">
                              <h4 className="text-xs font-bold text-zinc-800 break-words">{t.title}</h4>
                              <p className="text-[10px] text-zinc-400 font-light truncate">
                                {t.description || 'General'}
                              </p>
                            </div>
                            {renderAssigneeAvatar(t, 'small')}
                          </div>

                          <div className="flex items-center justify-between pt-2.5 border-t border-zinc-50">
                            <div className="flex items-center gap-1.5">
                              {getPriorityBadge(t.priority)}
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openEditModal(t)}
                                  className="p-1 rounded-lg text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                                  title="Edit Task"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(t._id)}
                                  className="p-1 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                  title="Delete Task"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 border border-dashed border-zinc-200 rounded-xl text-[10px] text-zinc-400 font-light space-y-1">
                        <span>Drop tasks here</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Right Column: Detailed Analytics Widgets */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Widget 1: Task Summary Donut Chart */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm space-y-4">
            <h3 className="font-display font-extrabold text-xs text-black uppercase tracking-wider flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-indigo-500" />
              Task Summary
            </h3>

            <div className="flex items-center justify-between gap-4">
              {/* Donut graphic */}
              <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {/* Outer circle layout segment */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                  
                  {/* Completed Segment */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray={`${completedPct} 100`} strokeDashoffset="0" />
                  
                  {/* In Progress Segment */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray={`${progressPct} 100`} strokeDashoffset={`-${completedPct}`} />
                  
                  {/* To Do Segment */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#94a3b8" strokeWidth="3" strokeDasharray={`${todoPct} 100`} strokeDashoffset={`-${completedPct + progressPct}`} />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="font-display font-extrabold text-lg text-black leading-none">{totalTasks}</span>
                  <span className="text-[7px] text-zinc-400 uppercase tracking-widest mt-0.5">Total Tasks</span>
                </div>
              </div>

              {/* Legend List */}
              <div className="flex-1 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
                    <span className="text-zinc-500 font-medium">To Do</span>
                  </div>
                  <span className="font-mono font-bold text-black">{counts.todo}</span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="text-zinc-500 font-medium">In Progress</span>
                  </div>
                  <span className="font-mono font-bold text-black">{counts.progress}</span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-zinc-500 font-medium">Completed</span>
                  </div>
                  <span className="font-mono font-bold text-black">{counts.completed}</span>
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-zinc-50">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="text-red-500 font-bold">High Priority</span>
                  </div>
                  <span className="font-mono font-bold text-red-500">{counts.high}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Widget 2: Categories Count list */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm space-y-4">
            <h3 className="font-display font-extrabold text-xs text-black uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              Categories
            </h3>

            <div className="space-y-3 text-xs">
              {getCategoryCounts().length === 0 ? (
                <div className="text-center py-4 text-zinc-400 font-light text-[10px]">
                  No active categories yet.
                </div>
              ) : (
                getCategoryCounts().map((cat) => (
                  <div key={cat.label} className="flex items-center justify-between p-1 hover:bg-zinc-50/50 rounded-lg transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${cat.bg} flex items-center justify-center shrink-0`}>
                        {cat.icon}
                      </div>
                      <span className="font-bold text-zinc-700">{cat.label}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400">
                      <span className="font-mono font-bold text-zinc-600 group-hover:text-black transition-colors">{cat.count}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-500 transition-all" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Widget 3: Productivity Score Gauge */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-extrabold text-xs text-black uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                Productivity Score
              </h3>
              <select className="text-[10px] font-bold text-zinc-500 border border-zinc-100 rounded px-1.5 py-0.5 focus:outline-none cursor-pointer">
                <option>All-Time</option>
              </select>
            </div>

            <div className="flex flex-col items-center justify-center pt-2">
              {/* Semi-circle Gauge SVG */}
              <div className="relative w-36 h-20 overflow-hidden flex items-end justify-center">
                <svg className="w-full h-full transform" viewBox="0 0 100 50">
                  {/* Base track */}
                  <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#f1f5f9" strokeWidth="8" strokeLinecap="round" />
                  
                  {/* Gauge value dynamic path */}
                  <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#10b981" strokeWidth="8" strokeLinecap="round" strokeDasharray="126" strokeDashoffset={dashOffset} className="transition-all duration-500 ease-out" />
                </svg>
                <div className="absolute bottom-1 flex flex-col items-center justify-end">
                  <span className="font-display font-extrabold text-2xl text-black leading-none">{productivityScore}%</span>
                  <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider mt-1.5">{productivityLabel}</span>
                </div>
              </div>

              <div className="text-center mt-4 space-y-1">
                <p className="text-[10px] text-zinc-400 font-light">
                  {productivityScore >= 80 
                    ? "Fantastic! You are extremely productive! 🚀" 
                    : productivityScore >= 50 
                      ? "Great progress! Keep completing tasks. 👍" 
                      : "Start completing tasks to boost your score! 💪"}
                </p>
              </div>
            </div>
          </div>


        </div>

      </div>

      {/* Task Edit / Creation Dialog Modal Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />

            {/* Dialog Card */}
            <motion.div
              variants={slideUp}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-md bg-white rounded-2xl border border-zinc-150 p-6 relative z-10 shadow-2xl space-y-6"
            >
              <div>
                <h3 className="font-display font-bold text-base text-black">
                  {editingTaskId ? 'Edit Task Card' : 'Create New Task Card'}
                </h3>
              </div>

              <form onSubmit={handleSaveTask} className="space-y-4">
                
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Task Title</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Provide task title..."
                    className="w-full px-3 py-2 bg-zinc-50 rounded-xl border border-zinc-200 focus:border-indigo-500 focus:outline-none text-xs text-zinc-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Project Name</label>
                  <input
                    type="text"
                    value={formProject}
                    onChange={(e) => setFormProject(e.target.value)}
                    placeholder="e.g. AI Assistant Redesign"
                    className="w-full px-3 py-2 bg-zinc-50 rounded-xl border border-zinc-200 focus:border-indigo-500 focus:outline-none text-xs text-zinc-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Priority</label>
                    <select
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 rounded-xl border border-zinc-200 focus:border-indigo-500 focus:outline-none text-xs text-zinc-800 cursor-pointer"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Category</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 rounded-xl border border-zinc-200 focus:border-indigo-500 focus:outline-none text-xs text-zinc-800 cursor-pointer"
                    >
                      <option value="general">General</option>
                      <option value="design">Design</option>
                      <option value="development">Development</option>
                      <option value="backend">Backend</option>
                      <option value="content">Content</option>
                      <option value="meeting">Meeting</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Due Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 rounded-xl border border-zinc-200 focus:border-indigo-500 focus:outline-none text-xs text-zinc-800 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Assignee</label>
                  <select
                    value={formAssignee ? formAssignee.email : 'unassigned'}
                    onChange={(e) => {
                      const selectedEmail = e.target.value;
                      if (selectedEmail === 'unassigned') {
                        setFormAssignee(null);
                      } else {
                        const match = members.find(m => m.email === selectedEmail);
                        if (match) {
                          setFormAssignee({
                            name: match.name,
                            email: match.email,
                            avatar: match.avatar
                          });
                        }
                      }
                    }}
                    className="w-full px-3 py-2 bg-zinc-50 rounded-xl border border-zinc-200 focus:border-indigo-500 focus:outline-none text-xs text-zinc-800 cursor-pointer"
                  >
                    <option value="unassigned">Unassigned</option>
                    {members.map(m => (
                      <option key={m.email} value={m.email}>{m.name || m.email} ({m.role})</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4 border-t border-zinc-100">
                  <div className="flex-1" />
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border border-zinc-200 text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg cursor-pointer"
                  >
                    {editingTaskId ? 'Save Changes' : 'Create Task'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setTaskToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Task?"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />

    </div>
  );
};

export default TasksPage;
