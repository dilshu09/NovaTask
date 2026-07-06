import mongoose from 'mongoose';
import crypto from 'crypto';
import User from '../models/User.js';
import UserSettings from '../models/UserSettings.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, hashToken } from '../utils/jwt.js';
import { ErrorResponse } from '../middleware/errorMiddleware.js';
import { registerSchema, verifyOtpSchema, loginSendOtpSchema, loginVerifyOtpSchema } from '../validators/authValidator.js';
import ActivityLog from '../models/ActivityLog.js';
import Notification from '../models/Notification.js';
import * as mockStore from '../utils/mockStore.js';
import { sendEmail } from '../utils/email.js';

// Helper to generate 6-digit OTP securely
const generateOTP = () => crypto.randomInt(100000, 1000000).toString();

// Helper to hash OTP code using SHA-256
const hashOTP = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

// @desc    Register a user (Step 1: Name and Email, sends OTP)
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      const errorMsg = validation.error.errors.map(err => err.message).join(', ');
      return next(new ErrorResponse(errorMsg, 400));
    }

    const { name, email } = validation.data;
    const isDbConnected = mongoose.connection.readyState === 1;

    let user;
    if (isDbConnected) {
      user = await User.findOne({ email });
    } else {
      user = await mockStore.findUserByEmail(email);
    }

    if (user && user.isVerified) {
      return next(new ErrorResponse('User already exists and is verified', 400));
    }

    const otpCode = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    const hashedOtp = hashOTP(otpCode);

    if (user) {
      user.name = name;
      user.otp = { code: hashedOtp, expiresAt: otpExpires };
      if (isDbConnected) {
        await user.save();
      } else {
        await mockStore.saveUser(user);
      }
    } else {
      if (isDbConnected) {
        user = await User.create({
          name,
          email,
          otp: { code: hashedOtp, expiresAt: otpExpires },
        });
      } else {
        user = await mockStore.createUser({
          name,
          email,
          isVerified: false,
        });
        user.otp = { code: hashedOtp, expiresAt: otpExpires };
        await mockStore.saveUser(user);
      }
    }

    // Send real/Ethereal email containing the verification OTP
    const emailResult = await sendEmail({
      email,
      subject: 'NovaTask - Verify Your Email',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #6366f1; text-align: center; margin-bottom: 20px;">Verify Your Email Address</h2>
          <p>Hi ${name || 'User'},</p>
          <p>Thank you for signing up for NovaTask Workspace. To complete your registration, please enter the following One-Time Password (OTP) verification code:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 4px; background: #f4f4f5; padding: 12px 24px; border-radius: 8px; color: #09090b; border: 1px solid #e4e4e7; display: inline-block;">${otpCode}</span>
          </div>
          <p style="color: #71717a; font-size: 12px; text-align: center;">This code is valid for 10 minutes. If you did not request this code, please ignore this email.</p>
        </div>
      `
    });

    res.status(200).json({
      success: true,
      message: 'Verification OTP sent to email. Please verify to continue.',
      email,
      previewUrl: emailResult?.previewUrl || undefined,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP (Step 2: Confirm OTP code)
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOtp = async (req, res, next) => {
  try {
    const validation = verifyOtpSchema.safeParse(req.body);
    if (!validation.success) {
      const errorMsg = validation.error.errors.map(err => err.message).join(', ');
      return next(new ErrorResponse(errorMsg, 400));
    }

    const { email, otp } = validation.data;
    const isDbConnected = mongoose.connection.readyState === 1;

    let user;
    if (isDbConnected) {
      user = await User.findOne({ email });
    } else {
      user = await mockStore.findUserByEmail(email);
    }

    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    if (!user.otp || user.otp.code !== hashOTP(otp) || new Date() > user.otp.expiresAt) {
      return next(new ErrorResponse('Invalid or expired OTP code', 400));
    }

    // Success! Verify user and log in immediately (no password required)
    user.isVerified = true;
    user.otp = undefined;

    const refreshToken = generateRefreshToken(user);
    user.refreshTokens = [hashToken(refreshToken)];

    if (isDbConnected) {
      await user.save();
      // Ensure settings and activity logs are populated
      const settingsExist = await UserSettings.findOne({ user: user._id });
      if (!settingsExist) {
        await UserSettings.create({ user: user._id });
      }
      await ActivityLog.create({
        user: user._id,
        action: 'user_register',
        details: 'User account created and verified successfully via passwordless registration.',
      });
    } else {
      await mockStore.saveUser(user);
      await mockStore.getSettings(user._id);
      await mockStore.createActivity(user._id, 'user_register', 'User account created and verified successfully via passwordless registration.');
    }

    const accessToken = generateAccessToken(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully. Registration completed.',
      accessToken,
      user: {
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



// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
export const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    const isDbConnected = mongoose.connection.readyState === 1;

    if (!refreshToken) {
      return next(new ErrorResponse('No refresh token provided', 401));
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return next(new ErrorResponse('Invalid refresh token', 401));
    }

    let user;
    if (isDbConnected && mongoose.Types.ObjectId.isValid(decoded.id)) {
      user = await User.findById(decoded.id);
    } else {
      user = await mockStore.findUserById(decoded.id);
    }

    if (!user || !user.refreshTokens.includes(hashToken(refreshToken))) {
      return next(new ErrorResponse('Token is not active or user not found', 401));
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    user.refreshTokens = user.refreshTokens.filter(t => t !== hashToken(refreshToken));
    user.refreshTokens.push(hashToken(newRefreshToken));
    if (user.refreshTokens.length > 5) {
      user.refreshTokens.shift();
    }

    if (isDbConnected) {
      await user.save();
    } else {
      await mockStore.saveUser(user);
    }

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    const isDbConnected = mongoose.connection.readyState === 1;

    if (refreshToken) {
      let user;
      if (isDbConnected) {
        user = await User.findById(req.user._id);
      } else {
        user = await mockStore.findUserById(req.user._id);
      }
      
      if (user) {
        user.refreshTokens = user.refreshTokens.filter(t => t !== hashToken(refreshToken));
        if (isDbConnected) {
          await user.save();
        } else {
          await mockStore.saveUser(user);
        }
      }
    }

    if (isDbConnected) {
      await ActivityLog.create({
        user: req.user._id,
        action: 'user_logout',
        details: 'User logged out.',
      });
    } else {
      await mockStore.createActivity(req.user._id, 'user_logout', 'User logged out.');
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get authenticated user info
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    let user, settings;

    if (isDbConnected) {
      user = await User.findById(req.user._id);
      settings = await UserSettings.findOne({ user: req.user._id });
      if (!settings) {
        settings = await UserSettings.create({
          user: req.user._id,
          theme: 'dark',
          highContrast: false,
          reducedMotion: false,
        });
      }
      if (!settings.members || settings.members.length === 0) {
        settings.members = [
          {
            name: user.name || 'Workspace Owner',
            email: user.email,
            avatar: user.avatar || null,
            role: 'owner',
            status: 'active'
          }
        ];
        await settings.save();
      }

      // Check if we need to create a team invitation notification
      const pendingNotif = await Notification.findOne({ user: user._id, title: 'Workspace Team Invitation' });
      if (!pendingNotif) {
        const inviteSettings = await UserSettings.findOne({ "members.email": user.email.toLowerCase() });
        if (inviteSettings) {
          const inviter = await User.findById(inviteSettings.user);
          await Notification.create({
            user: user._id,
            title: 'Workspace Team Invitation',
            message: `You have been invited by ${inviter?.name || inviter?.email || 'a team member'} to join their workspace.`,
            type: 'system',
          });
        }
      }
    } else {
      user = await mockStore.findUserById(req.user._id);
      settings = await mockStore.getSettings(req.user._id);

      const mockNotifs = await mockStore.getNotifications(user._id);
      const pendingNotif = mockNotifs.find(n => n.title === 'Workspace Team Invitation');
      if (!pendingNotif) {
        const inviteSettings = await mockStore.findPendingInvite(user.email);
        if (inviteSettings) {
          const inviter = await mockStore.findUserById(inviteSettings.user);
          await mockStore.createNotification(
            user._id,
            'Workspace Team Invitation',
            `You have been invited by ${inviter?.name || inviter?.email || 'a team member'} to join their workspace.`
          );
        }
      }
    }

    res.status(200).json({
      success: true,
      user,
      settings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send Login OTP (Passwordless Step 1)
// @route   POST /api/auth/login/send-otp
// @access  Public
export const loginSendOtp = async (req, res, next) => {
  try {
    const validation = loginSendOtpSchema.safeParse(req.body);
    if (!validation.success) {
      const errorMsg = validation.error.errors.map(err => err.message).join(', ');
      return next(new ErrorResponse(errorMsg, 400));
    }

    const { email } = validation.data;
    const isDbConnected = mongoose.connection.readyState === 1;

    let user;
    if (isDbConnected) {
      user = await User.findOne({ email });
    } else {
      user = await mockStore.findUserByEmail(email);
    }

    if (!user) {
      return next(new ErrorResponse('Account not found with this email', 404));
    }

    const otpCode = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    const hashedOtp = hashOTP(otpCode);

    user.otp = { code: hashedOtp, expiresAt: otpExpires };

    if (isDbConnected) {
      await user.save();
    } else {
      await mockStore.saveUser(user);
    }

    // Send email via nodemailer
    const emailResult = await sendEmail({
      email,
      subject: 'NovaTask - Login Verification Code',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #6366f1; text-align: center; margin-bottom: 20px;">Your Login Verification Code</h2>
          <p>Hi ${user.name || 'User'},</p>
          <p>Use the following One-Time Password (OTP) code to log in to your NovaTask Workspace:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 4px; background: #f4f4f5; padding: 12px 24px; border-radius: 8px; color: #09090b; border: 1px solid #e4e4e7; display: inline-block;">${otpCode}</span>
          </div>
          <p style="color: #71717a; font-size: 12px; text-align: center;">This code is valid for 10 minutes. If you did not request this login code, please secure your account.</p>
        </div>
      `
    });

    res.status(200).json({
      success: true,
      message: 'Login OTP verification email sent.',
      email,
      previewUrl: emailResult?.previewUrl || undefined,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Login OTP (Passwordless Step 2)
// @route   POST /api/auth/login/verify-otp
// @access  Public
export const loginVerifyOtp = async (req, res, next) => {
  try {
    const validation = loginVerifyOtpSchema.safeParse(req.body);
    if (!validation.success) {
      const errorMsg = validation.error.errors.map(err => err.message).join(', ');
      return next(new ErrorResponse(errorMsg, 400));
    }

    const { email, otp } = validation.data;
    const isDbConnected = mongoose.connection.readyState === 1;

    let user;
    if (isDbConnected) {
      user = await User.findOne({ email });
    } else {
      user = await mockStore.findUserByEmail(email);
    }

    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    if (!user.otp || user.otp.code !== hashOTP(otp) || new Date() > user.otp.expiresAt) {
      return next(new ErrorResponse('Invalid or expired OTP code', 400));
    }

    // Success! Clear OTP and mark verified (if not already)
    user.isVerified = true;
    user.otp = undefined;

    const refreshToken = generateRefreshToken(user);
    user.refreshTokens = [hashToken(refreshToken)]; // Reset active refresh tokens list on new OTP verify for security

    if (isDbConnected) {
      await user.save();
      await ActivityLog.create({
        user: user._id,
        action: 'user_login',
        details: 'User logged in successfully via passwordless email OTP.',
      });
    } else {
      await mockStore.saveUser(user);
      await mockStore.createActivity(user._id, 'user_login', 'User logged in successfully via passwordless email OTP.');
    }

    const accessToken = generateAccessToken(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      accessToken,
      user: {
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

