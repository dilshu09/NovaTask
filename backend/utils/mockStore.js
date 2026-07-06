// In-memory data store for backend fallback when MongoDB is disconnected

const users = [];
const tasks = [];
const settings = [];
const activities = [];
const notifications = [];

export const findUserByEmail = async (email) => {
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
};

export const findUserById = async (id) => {
  return users.find(u => u._id === id.toString()) || null;
};

export const createUser = async (userObj) => {
  const newUser = {
    _id: `mock_user_${Date.now()}`,
    name: userObj.name,
    email: userObj.email.toLowerCase(),
    isVerified: userObj.isVerified || false,
    googleId: userObj.googleId || null,
    refreshTokens: [],
    createdAt: new Date(),
  };
  users.push(newUser);
  return newUser;
};

export const saveUser = async (user) => {
  const idx = users.findIndex(u => u._id === user._id);
  if (idx !== -1) {
    users[idx] = user;
  }
  return user;
};

// Task Operations
export const getTasks = async (userId, filters = {}) => {
  const user = users.find(u => u._id === userId.toString());
  const userEmail = user?.email || '';

  let userTasks = tasks.filter(t => 
    t.user === userId.toString() || 
    (t.assignee && t.assignee.email && t.assignee.email.toLowerCase() === userEmail.toLowerCase()) ||
    (t.assignees && t.assignees.some(a => a.email && a.email.toLowerCase() === userEmail.toLowerCase()))
  );
  
  if (filters.status) {
    userTasks = userTasks.filter(t => t.status === filters.status);
  }
  if (filters.priority) {
    userTasks = userTasks.filter(t => t.priority === filters.priority);
  }
  if (filters.category) {
    userTasks = userTasks.filter(t => t.category === filters.category);
  }
  if (filters.search) {
    const query = filters.search.toLowerCase();
    userTasks = userTasks.filter(t => 
      t.title.toLowerCase().includes(query) || 
      t.description.toLowerCase().includes(query)
    );
  }
  
  return userTasks.sort((a, b) => a.position - b.position);
};

export const createTask = async (taskObj, userId) => {
  const taskCount = tasks.filter(t => t.user === userId.toString() && t.status === (taskObj.status || 'todo')).length;
  
  const newTask = {
    _id: `mock_task_${Date.now()}`,
    title: taskObj.title,
    description: taskObj.description || '',
    status: taskObj.status || 'todo',
    priority: taskObj.priority || 'medium',
    category: taskObj.category || 'general',
    dueDate: taskObj.dueDate || null,
    position: taskObj.position ?? taskCount,
    user: userId.toString(),
    assignee: taskObj.assignee || null,
    createdAt: new Date(),
  };
  tasks.push(newTask);
  return newTask;
};

export const updateTask = async (taskId, updateObj, userId) => {
  const idx = tasks.findIndex(t => t._id === taskId && t.user === userId.toString());
  if (idx === -1) return null;
  
  const original = tasks[idx];
  const updated = { ...original, ...updateObj };
  tasks[idx] = updated;
  return updated;
};

export const deleteTask = async (taskId, userId) => {
  const idx = tasks.findIndex(t => t._id === taskId && t.user === userId.toString());
  if (idx === -1) return false;
  
  tasks.splice(idx, 1);
  return true;
};

export const bulkUpdateTasks = async (ids, action, value, userId) => {
  const updatedIds = ids.map(id => id.toString());
  tasks.forEach((t, i) => {
    if (updatedIds.includes(t._id) && t.user === userId.toString()) {
      if (action === 'update_status') {
        tasks[i].status = value;
      } else if (action === 'update_priority') {
        tasks[i].priority = value;
      } else if (action === 'update_category') {
        tasks[i].category = value;
      }
    }
  });
  
  if (action === 'delete') {
    const idsToDelete = new Set(updatedIds);
    let i = tasks.length;
    while (i--) {
      if (idsToDelete.has(tasks[i]._id) && tasks[i].user === userId.toString()) {
        tasks.splice(i, 1);
      }
    }
  }
  return true;
};

// Settings
export const getSettings = async (userId) => {
  let userSettings = settings.find(s => s.user === userId.toString());
  if (!userSettings) {
    const userObj = users.find(u => u._id === userId.toString());
    userSettings = {
      _id: `mock_settings_${Date.now()}`,
      user: userId.toString(),
      theme: 'dark',
      highContrast: false,
      reducedMotion: false,
      voiceWakePhrase: 'Hey Nova',
      voiceSpeed: 1.0,
      voicePitch: 1.0,
      members: [
        {
          name: userObj?.name || 'Workspace Owner',
          email: userObj?.email || 'owner@novatask.ai',
          avatar: userObj?.avatar || null,
          role: 'owner',
          status: 'active'
        },
        {
          name: 'Alex Chen',
          email: 'alex@novatask.ai',
          avatar: null,
          role: 'editor',
          status: 'active'
        },
        {
          name: 'Sarah Jenkins',
          email: 'sarah@novatask.ai',
          avatar: null,
          role: 'admin',
          status: 'active'
        }
      ]
    };
    settings.push(userSettings);
  }
  return userSettings;
};

export const updateSettings = async (userId, payload) => {
  const s = await getSettings(userId);
  Object.assign(s, payload);
  return s;
};

// Activity logs
export const createActivity = async (userId, action, details, metadata = {}) => {
  const newActivity = {
    _id: `mock_activity_${Date.now()}`,
    user: userId.toString(),
    action,
    details,
    metadata,
    createdAt: new Date(),
  };
  activities.unshift(newActivity); // add to top
  return newActivity;
};

export const getActivities = async (userId) => {
  return activities.filter(a => a.user === userId.toString()).slice(0, 50);
};

// Notifications
export const getNotifications = async (userId) => {
  return notifications.filter(n => n.user === userId.toString());
};

export const createNotification = async (userId, title, message, type = 'system', metadata = {}) => {
  const newNotif = {
    _id: `mock_notif_${Date.now()}`,
    user: userId.toString(),
    title,
    message,
    type,
    isRead: false,
    metadata,
    createdAt: new Date(),
  };
  notifications.unshift(newNotif);
  return newNotif;
};

export const markNotificationRead = async (notifId, userId) => {
  const n = notifications.find(n => n._id === notifId && n.user === userId.toString());
  if (n) {
    n.isRead = true;
    return n;
  }
  return null;
};

export const deleteNotification = async (notifId, userId) => {
  const idx = notifications.findIndex(n => n._id === notifId && n.user === userId.toString());
  if (idx !== -1) {
    notifications.splice(idx, 1);
    return true;
  }
  return false;
};

export const findPendingInvite = async (email) => {
  return settings.find(s => s.members && s.members.some(m => m.email.toLowerCase() === email.toLowerCase()));
};

export const deleteUser = async (userId) => {
  const userIdx = users.findIndex(u => u._id === userId.toString());
  if (userIdx === -1) return false;
  
  const user = users[userIdx];
  const email = user.email;
  
  users.splice(userIdx, 1);
  
  const settingsIdx = settings.findIndex(s => s.user === userId.toString());
  if (settingsIdx !== -1) settings.splice(settingsIdx, 1);
  
  let i = tasks.length;
  while (i--) {
    const t = tasks[i];
    const isOwner = t.user === userId.toString();
    const isAssignee = t.assignee && t.assignee.email && t.assignee.email.toLowerCase() === email.toLowerCase();
    const isMember = t.assignees && t.assignees.some(a => a.email && a.email.toLowerCase() === email.toLowerCase());
    if (isOwner || isAssignee || isMember) {
      tasks.splice(i, 1);
    }
  }

  let j = activities.length;
  while (j--) {
    if (activities[j].user === userId.toString()) {
      activities.splice(j, 1);
    }
  }

  let k = notifications.length;
  while (k--) {
    if (notifications[k].user === userId.toString()) {
      notifications.splice(k, 1);
    }
  }
  
  return true;
};

// Pre-populate with standard mock user for testing (password: password123)
const init = async () => {
  const testUser = await createUser({
    name: 'Pasindu D.',
    email: 'admin@novatask.ai',
    isVerified: true
  });
  testUser._id = 'mock_pasindu_id_123'; // Static ID for convenience
  
  // Add some default plan tasks for Pasindu
  tasks.push(
    { _id: 't1', title: 'Design AI Assistant Flow', status: 'todo', priority: 'medium', category: 'design', user: 'mock_pasindu_id_123', position: 0, createdAt: new Date() },
    { _id: 't2', title: 'Create Landing Page', status: 'done', priority: 'high', category: 'development', user: 'mock_pasindu_id_123', position: 1, createdAt: new Date() },
    { _id: 't3', title: 'Database Schema Design', status: 'todo', priority: 'high', category: 'development', user: 'mock_pasindu_id_123', position: 2, createdAt: new Date() },
    { _id: 't4', title: 'API Integration', status: 'todo', priority: 'high', category: 'development', user: 'mock_pasindu_id_123', position: 3, createdAt: new Date() },
    { _id: 't5', title: 'Testing & Debugging', status: 'todo', priority: 'low', category: 'general', user: 'mock_pasindu_id_123', position: 4, createdAt: new Date() },
    { _id: 't6', title: 'Team Standup', status: 'done', priority: 'medium', category: 'operations', user: 'mock_pasindu_id_123', position: 5, createdAt: new Date() }
  );

  // Add default notifications
  notifications.push(
    { _id: 'n1', user: 'mock_pasindu_id_123', title: 'Welcome to NovaTask', message: 'Ready to manage your workload with AI help.', isRead: false, createdAt: new Date() }
  );
};
init();
