import mongoose from 'mongoose';
import Task from '../models/Task.js';
import { ErrorResponse } from '../middleware/errorMiddleware.js';
import { createTaskSchema, updateTaskSchema } from '../validators/taskValidator.js';
import ActivityLog from '../models/ActivityLog.js';
import * as mockStore from '../utils/mockStore.js';

// @desc    Get all user tasks (with search, priority/category/status filters)
// @route   GET /api/tasks
// @access  Private
export const getTasks = async (req, res, next) => {
  try {
    const { status, priority, category, search } = req.query;
    const isDbConnected = mongoose.connection.readyState === 1;

    let tasks;

    if (isDbConnected) {
      const query = {
        $or: [
          { user: req.user._id },
          { "assignee.email": { $regex: `^${req.user.email}$`, $options: 'i' } },
          { "assignees.email": { $regex: `^${req.user.email}$`, $options: 'i' } }
        ]
      };
      if (status) query.status = status;
      if (priority) query.priority = priority;
      if (category) query.category = category;
      if (search) {
        query.$and = [
          {
            $or: [
              { title: { $regex: search, $options: 'i' } },
              { description: { $regex: search, $options: 'i' } },
            ]
          }
        ];
      }
      tasks = await Task.find(query).sort({ position: 1, createdAt: -1 });
    } else {
      tasks = await mockStore.getTasks(req.user._id, { status, priority, category, search });
    }

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a task
// @route   POST /api/tasks
// @access  Private
export const createTask = async (req, res, next) => {
  try {
    const validation = createTaskSchema.safeParse(req.body);
    if (!validation.success) {
      const errorMsg = validation.error.errors.map(err => err.message).join(', ');
      return next(new ErrorResponse(errorMsg, 400));
    }

    const isDbConnected = mongoose.connection.readyState === 1;
    let task;

    if (isDbConnected) {
      const taskStatus = validation.data.status || 'todo';
      const taskCount = await Task.countDocuments({ user: req.user._id, status: taskStatus });
      task = await Task.create({
        ...validation.data,
        user: req.user._id,
        position: validation.data.position ?? taskCount,
      });
      await ActivityLog.create({
        user: req.user._id,
        action: 'task_create',
        details: `Created task "${task.title}"`,
        metadata: { taskId: task._id },
      });
    } else {
      task = await mockStore.createTask(validation.data, req.user._id);
      await mockStore.createActivity(req.user._id, 'task_create', `Created task "${task.title}"`, { taskId: task._id });
    }

    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
export const updateTask = async (req, res, next) => {
  try {
    const validation = updateTaskSchema.safeParse(req.body);
    if (!validation.success) {
      const errorMsg = validation.error.errors.map(err => err.message).join(', ');
      return next(new ErrorResponse(errorMsg, 400));
    }

    const isDbConnected = mongoose.connection.readyState === 1;
    let task;

    if (isDbConnected) {
      task = await Task.findOne({ _id: req.params.id, user: req.user._id });
      if (!task) {
        return next(new ErrorResponse('Task not found', 404));
      }

      const statusChanged = validation.data.status && validation.data.status !== task.status;
      const oldStatus = task.status;

      task = await Task.findByIdAndUpdate(
        req.params.id,
        { $set: validation.data },
        { new: true, runValidators: true }
      );

      if (statusChanged) {
        const oldColTasks = await Task.find({ user: req.user._id, status: oldStatus }).sort({ position: 1 });
        for (let i = 0; i < oldColTasks.length; i++) {
          oldColTasks[i].position = i;
          await oldColTasks[i].save();
        }

        if (validation.data.position === undefined) {
          const newColCount = await Task.countDocuments({ user: req.user._id, status: task.status });
          task.position = Math.max(0, newColCount - 1);
          await task.save();
        }
      }

      await ActivityLog.create({
        user: req.user._id,
        action: 'task_update',
        details: `Updated task "${task.title}"`,
        metadata: { taskId: task._id, fields: Object.keys(validation.data) },
      });
    } else {
      task = await mockStore.updateTask(req.params.id, validation.data, req.user._id);
      if (!task) {
        return next(new ErrorResponse('Task not found', 404));
      }
      await mockStore.createActivity(req.user._id, 'task_update', `Updated task "${task.title}"`, { taskId: task._id });
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
export const deleteTask = async (req, res, next) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
      if (!task) {
        return next(new ErrorResponse('Task not found', 404));
      }

      await task.deleteOne();

      const colTasks = await Task.find({ user: req.user._id, status: task.status }).sort({ position: 1 });
      for (let i = 0; i < colTasks.length; i++) {
        colTasks[i].position = i;
        await colTasks[i].save();
      }

      await ActivityLog.create({
        user: req.user._id,
        action: 'task_delete',
        details: `Deleted task "${task.title}"`,
        metadata: { title: task.title },
      });
    } else {
      const deleted = await mockStore.deleteTask(req.params.id, req.user._id);
      if (!deleted) {
        return next(new ErrorResponse('Task not found', 404));
      }
      await mockStore.createActivity(req.user._id, 'task_delete', `Deleted task ID ${req.params.id}`);
    }

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk actions
// @route   POST /api/tasks/bulk
// @access  Private
export const bulkTasksAction = async (req, res, next) => {
  try {
    const { ids, action, value } = req.body;
    const isDbConnected = mongoose.connection.readyState === 1;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return next(new ErrorResponse('Task IDs are required', 400));
    }

    if (isDbConnected) {
      if (action === 'delete') {
        await Task.deleteMany({ _id: { $in: ids }, user: req.user._id });
        await ActivityLog.create({
          user: req.user._id,
          action: 'task_delete',
          details: `Bulk deleted ${ids.length} tasks`,
        });
      } else {
        const updateField = action === 'update_status' ? { status: value } : action === 'update_priority' ? { priority: value } : { category: value };
        await Task.updateMany({ _id: { $in: ids }, user: req.user._id }, { $set: updateField });
        await ActivityLog.create({
          user: req.user._id,
          action: 'task_bulk_update',
          details: `Bulk updated ${ids.length} tasks: ${action} = ${value}`,
        });
      }
    } else {
      await mockStore.bulkUpdateTasks(ids, action, value, req.user._id);
      await mockStore.createActivity(req.user._id, 'task_bulk_update', `Bulk updated ${ids.length} tasks: ${action}`);
    }

    res.status(200).json({ success: true, message: 'Bulk action completed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get AI Suggestions from Maga AI based on active tasks
// @route   GET /api/tasks/ai-suggest
// @access  Private
export const getAISuggestions = async (req, res, next) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    let overdueTasksCount = 0;
    let hasHighPriority = false;
    let totalTasksCount = 0;
    let doneTasksCount = 0;

    if (isDbConnected) {
      const overdueTasks = await Task.find({
        user: req.user._id,
        status: { $ne: 'done' },
        dueDate: { $lte: new Date() },
      });
      overdueTasksCount = overdueTasks.length;

      const highPriorityTasks = await Task.find({
        user: req.user._id,
        status: { $ne: 'done' },
        priority: 'high',
      });
      hasHighPriority = highPriorityTasks.length > 0;

      totalTasksCount = await Task.countDocuments({ user: req.user._id });
      doneTasksCount = await Task.countDocuments({ user: req.user._id, status: 'done' });
    } else {
      const allTasks = await mockStore.getTasks(req.user._id);
      overdueTasksCount = allTasks.filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate) <= new Date()).length;
      hasHighPriority = allTasks.filter(t => t.status !== 'done' && t.priority === 'high').length > 0;
      totalTasksCount = allTasks.length;
      doneTasksCount = allTasks.filter(t => t.status === 'done').length;
    }

    const completionRate = totalTasksCount > 0 ? Math.round((doneTasksCount / totalTasksCount) * 100) : 0;
    const suggestions = [];

    // Suggestions matching standard dashboard prompt details:
    suggestions.push({
      id: 'suggest_productivity_window',
      type: 'info',
      title: 'You work best between',
      text: '9:00 AM - 11:00 AM',
      action: 'View all insights',
    });

    suggestions.push({
      id: 'suggest_high_priority',
      type: 'warning',
      title: 'Try completing high priority',
      text: 'tasks in the morning',
      action: 'View all insights',
    });

    suggestions.push({
      id: 'suggest_break_time',
      type: 'critical',
      title: 'Time to take a break?',
      text: "You've been focused for 2h",
      action: 'View all insights',
    });

    res.status(200).json({
      success: true,
      suggestions,
    });
  } catch (error) {
    next(error);
  }
};
