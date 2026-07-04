import mongoose from 'mongoose';
import User from '../models/User.js';
import UserSettings from '../models/UserSettings.js';
import ActivityLog from '../models/ActivityLog.js';
import Notification from '../models/Notification.js';
import { ErrorResponse } from '../middleware/errorMiddleware.js';
import * as mockStore from '../utils/mockStore.js';

// @desc    Update user profile (Name/Avatar)
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const isDbConnected = mongoose.connection.readyState === 1;

    let user;
    if (isDbConnected) {
      user = await User.findById(req.user._id);
      if (!user) return next(new ErrorResponse('User not found', 404));
      
      if (name) user.name = name;
      if (avatar !== undefined) user.avatar = avatar;
      await user.save();

      await ActivityLog.create({
        user: req.user._id,
        action: 'profile_update',
        details: 'Updated user profile metadata',
      });
    } else {
      user = await mockStore.findUserById(req.user._id);
      if (!user) return next(new ErrorResponse('User not found', 404));
      
      if (name) user.name = name;
      if (avatar !== undefined) user.avatar = avatar;
      await mockStore.saveUser(user);

      await mockStore.createActivity(req.user._id, 'profile_update', 'Updated user profile metadata');
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user preferences/settings
// @route   PUT /api/users/settings
// @access  Private
export const updateSettings = async (req, res, next) => {
  try {
    const { theme, highContrast, reducedMotion, voiceWakePhrase, voiceSpeed, voicePitch } = req.body;
    const isDbConnected = mongoose.connection.readyState === 1;
    let settings;

    if (isDbConnected) {
      settings = await UserSettings.findOne({ user: req.user._id });
      if (!settings) {
        settings = new UserSettings({ user: req.user._id });
      }

      if (theme) settings.theme = theme;
      if (highContrast !== undefined) settings.highContrast = highContrast;
      if (reducedMotion !== undefined) settings.reducedMotion = reducedMotion;
      if (voiceWakePhrase) settings.voiceWakePhrase = voiceWakePhrase;
      if (voiceSpeed !== undefined) settings.voiceSpeed = voiceSpeed;
      if (voicePitch !== undefined) settings.voicePitch = voicePitch;
      await settings.save();

      await ActivityLog.create({
        user: req.user._id,
        action: 'settings_update',
        details: 'Updated preference and accessibility settings',
      });
    } else {
      settings = await mockStore.updateSettings(req.user._id, {
        theme,
        highContrast,
        reducedMotion,
        voiceWakePhrase,
        voiceSpeed,
        voicePitch,
      });
      await mockStore.createActivity(req.user._id, 'settings_update', 'Updated preference and accessibility settings');
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user activity logs
// @route   GET /api/users/activities
// @access  Private
export const getActivityLogs = async (req, res, next) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    let logs;

    if (isDbConnected) {
      logs = await ActivityLog.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .limit(50);
    } else {
      logs = await mockStore.getActivities(req.user._id);
    }

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user notifications
// @route   GET /api/users/notifications
// @access  Private
export const getNotifications = async (req, res, next) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    let notifications;

    if (isDbConnected) {
      notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
    } else {
      notifications = await mockStore.getNotifications(req.user._id);
    }

    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/users/notifications/:id/read
// @access  Private
export const markNotificationRead = async (req, res, next) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    let notification;

    if (isDbConnected) {
      notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
      if (!notification) return next(new ErrorResponse('Notification not found', 404));
      
      notification.isRead = true;
      await notification.save();
    } else {
      notification = await mockStore.markNotificationRead(req.params.id, req.user._id);
      if (!notification) return next(new ErrorResponse('Notification not found', 404));
    }

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete notification
// @route   DELETE /api/users/notifications/:id
// @access  Private
export const deleteNotification = async (req, res, next) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
      if (!notification) return next(new ErrorResponse('Notification not found', 404));
      await notification.deleteOne();
    } else {
      const deleted = await mockStore.deleteNotification(req.params.id, req.user._id);
      if (!deleted) return next(new ErrorResponse('Notification not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Notification removed successfully',
    });
  } catch (error) {
    next(error);
  }
};
