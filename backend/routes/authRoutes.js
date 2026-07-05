import express from 'express';
import passport from 'passport';
import {
  register,
  verifyOtp,
  login,
  loginSendOtp,
  loginVerifyOtp,
  refresh,
  logout,
  getMe,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';

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

    req.user.refreshTokens.push(refreshToken);
    await req.user.save();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?token=${accessToken}`);
  } catch (error) {
    console.error('Google OAuth Callback Error:', error);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=auth_failed`);
  }
});

// Public Auth Endpoints with rate-limiting
router.post('/register', authLimiter, register);
router.post('/verify-otp', authLimiter, verifyOtp);
router.post('/login', authLimiter, login);
router.post('/login/send-otp', authLimiter, loginSendOtp);
router.post('/login/verify-otp', authLimiter, loginVerifyOtp);
router.post('/refresh', refresh);

// Protected Auth Endpoints
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

export default router;
