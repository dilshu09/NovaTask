import express from 'express';
import passport from 'passport';
import {
  register,
  verifyOtp,
  loginSendOtp,
  loginVerifyOtp,
  refresh,
  logout,
  getMe,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { generateAccessToken, generateRefreshToken, hashToken } from '../utils/jwt.js';

const router = express.Router();

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account', session: false }));
router.get('/google/callback', passport.authenticate('google', { 
  failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=auth_failed`, 
  session: false 
}), async (req, res, next) => {
  try {
    const accessToken = generateAccessToken(req.user);
    const refreshToken = generateRefreshToken(req.user);

    if (!req.user.refreshTokens || !Array.isArray(req.user.refreshTokens)) {
      req.user.refreshTokens = [];
    }
    req.user.refreshTokens.push(hashToken(refreshToken));
    if (req.user.refreshTokens.length > 5) {
      req.user.refreshTokens.shift();
    }
    if (typeof req.user.save === 'function') {
      await req.user.save();
    }

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('oauthToken', accessToken, {
      httpOnly: false, // client JS needs to read it
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 120000, // 2 mins
    });

    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login`);
  } catch (error) {
    console.error('Google OAuth Callback Error:', error);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=auth_failed`);
  }
});

// Public Auth Endpoints with rate-limiting
router.post('/register', authLimiter, register);
router.post('/verify-otp', authLimiter, verifyOtp);
router.post('/login/send-otp', authLimiter, loginSendOtp);
router.post('/login/verify-otp', authLimiter, loginVerifyOtp);
router.post('/refresh', refresh);

// Protected Auth Endpoints
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

export default router;
