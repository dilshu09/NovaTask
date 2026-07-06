import mongoose from 'mongoose';
import User from '../models/User.js';
import UserSettings from '../models/UserSettings.js';
import ActivityLog from '../models/ActivityLog.js';
import Notification from '../models/Notification.js';
import { ErrorResponse } from '../middleware/errorMiddleware.js';
import * as mockStore from '../utils/mockStore.js';
import { sendEmail } from '../utils/email.js';

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
    const { theme, highContrast, reducedMotion, voiceEnabled, voiceWakePhrase, voiceSpeed, voicePitch, members } = req.body;
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
      if (voiceEnabled !== undefined) settings.voiceEnabled = voiceEnabled;
      if (voiceWakePhrase) settings.voiceWakePhrase = voiceWakePhrase;
      if (voiceSpeed !== undefined) settings.voiceSpeed = voiceSpeed;
      if (voicePitch !== undefined) settings.voicePitch = voicePitch;
      if (members !== undefined) settings.members = members;
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
        voiceEnabled,
        voiceWakePhrase,
        voiceSpeed,
        voicePitch,
        members,
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

// @desc    Add member to user settings (Invite Collaborator)
// @route   PUT /api/users/settings/members
// @access  Private
export const updateMembers = async (req, res, next) => {
  try {
    const { email, name, role } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const isDbConnected = mongoose.connection.readyState === 1;
    let settings;

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 25px; border: 1px solid #e4e4e7; border-radius: 16px; background: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="background: #e0e7ff; color: #4f46e5; font-size: 11px; font-weight: bold; text-transform: uppercase; padding: 6px 12px; border-radius: 9999px; letter-spacing: 0.8px;">Collaboration Invite</span>
        </div>
        <h2 style="color: #09090b; font-size: 20px; font-weight: 800; text-align: center; margin: 10px 0;">Join the Workspace Team</h2>
        <p style="color: #3f3f46; font-size: 13px; line-height: 1.6; margin-top: 15px;">
          Hi ${name || email.split('@')[0]},
        </p>
        <p style="color: #3f3f46; font-size: 13px; line-height: 1.6;">
          You have been invited by <strong>${req.user.name || req.user.email}</strong> to join their team in the <strong>NovaTask Workspace</strong> as an <strong>${role || 'editor'}</strong>.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 13px; font-weight: 600; display: inline-block; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.15);">Accept & Sign In</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #f4f4f5; margin: 25px 0;" />
        <p style="color: #71717a; font-size: 11px; text-align: center;">This invitation was sent automatically by NovaTask Workspace. If you did not expect this invitation, please disregard this email.</p>
      </div>
    `;

    if (isDbConnected) {
      settings = await UserSettings.findOne({ user: req.user._id });
      if (!settings) {
        settings = new UserSettings({ user: req.user._id });
      }

      // Check if already exists
      const exists = settings.members.some(m => m.email.toLowerCase() === email.toLowerCase());
      if (!exists) {
        settings.members.push({
          name: name || email.split('@')[0],
          email: email.toLowerCase(),
          avatar: null,
          role: role || 'editor',
          status: 'invited'
        });
        await settings.save();
        
        try {
          const receiver = await User.findOne({ email: email.toLowerCase() });
          if (receiver) {
            await Notification.create({
              user: receiver._id,
              title: 'Workspace Team Invitation',
              message: `You have been invited by ${req.user.name || req.user.email} to join their team as an ${role || 'editor'}.`,
              type: 'system',
            });
          }
        } catch (notifErr) {
          console.error('[NOTIFICATION ERROR] Failed to send in-app notification:', notifErr);
        }

        try {
          await sendEmail({
            email: email.toLowerCase(),
            subject: 'NovaTask Workspace - You have been invited to join a team!',
            html: emailHtml
          });
        } catch (mailErr) {
          console.error('[MAIL ERROR] Failed to send invitation email:', mailErr);
        }
      }
    } else {
      settings = await mockStore.getSettings(req.user._id);
      const exists = settings.members.some(m => m.email.toLowerCase() === email.toLowerCase());
      if (!exists) {
        settings.members.push({
          name: name || email.split('@')[0],
          email: email.toLowerCase(),
          avatar: null,
          role: role || 'editor',
          status: 'invited'
        });
        await mockStore.updateSettings(req.user._id, { members: settings.members });

        try {
          const receiver = await mockStore.findUserByEmail(email);
          if (receiver) {
            await mockStore.createNotification(
              receiver._id,
              'Workspace Team Invitation',
              `You have been invited by ${req.user.name || req.user.email} to join their team as an ${role || 'editor'}.`
            );
          }
        } catch (notifErr) {
          console.error('[NOTIFICATION ERROR] Failed to send mock in-app notification:', notifErr);
        }

        try {
          await sendEmail({
            email: email.toLowerCase(),
            subject: 'NovaTask Workspace - You have been invited to join a team!',
            html: emailHtml
          });
        } catch (mailErr) {
          console.error('[MAIL ERROR] Failed to send invitation email:', mailErr);
        }
      }
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user account
// @route   DELETE /api/users
// @access  Private
export const deleteAccount = async (req, res, next) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const user = await User.findById(req.user._id);
      if (!user) return next(new ErrorResponse('User not found', 404));
      
      // Cascade delete is handled by Mongoose schema middleware pre-hook
      await user.deleteOne();
    } else {
      const deleted = await mockStore.deleteUser(req.user._id);
      if (!deleted) return next(new ErrorResponse('User not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Account and associated data deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

