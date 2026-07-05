import 'dotenv/config';
import express from 'express';

import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import * as mockStore from './utils/mockStore.js';
import { errorHandler, ErrorResponse } from './middleware/errorMiddleware.js';
import { apiLimiter } from './middleware/rateLimiter.js';

// Route files
import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import userRoutes from './routes/userRoutes.js';
import voiceRoutes from './routes/voiceRoutes.js';

// Models & Utils for Mock OAuth
import User from './models/User.js';
import UserSettings from './models/UserSettings.js';
import ActivityLog from './models/ActivityLog.js';
import { generateAccessToken, generateRefreshToken } from './utils/jwt.js';

// Connect to database
connectDB();

import passport from './config/passport.js';

const app = express();

// Initialize Passport
app.use(passport.initialize());

// Security Headers
app.use(helmet());

// Cookie parser
app.use(cookieParser());

// CORS config
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dev logging middleware
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Apply rate limiter to general api routes
app.use('/api/', apiLimiter);

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/voice', voiceRoutes);

// Support both /api/* and root-level aliases for production deployments
app.use('/auth', authRoutes);
app.use('/tasks', taskRoutes);
app.use('/users', userRoutes);
app.use('/voice', voiceRoutes);

// Add a mock social login callback endpoint for testing
app.post('/api/auth/oauth-mock', async (req, res, next) => {
  try {
    const { provider, email, name, id } = req.body;
    if (!email || !name) {
      return next(new ErrorResponse('OAuth email and name are required', 400));
    }



    const isDbConnected = mongoose.connection.readyState === 1;
    let user;

    if (isDbConnected) {
      user = await User.findOne({ email });
    } else {
      user = await mockStore.findUserByEmail(email);
    }

    if (!user) {
      // Create user
      const providerField = provider === 'google' ? 'googleId' : provider === 'facebook' ? 'facebookId' : 'appleId';
      
      if (isDbConnected) {
        user = await User.create({
          name,
          email,
          isVerified: true,
          [providerField]: id || `mock_oauth_id_${Date.now()}`,
        });
        await UserSettings.create({ user: user._id });
      } else {
        user = await mockStore.createUser({
          name,
          email,
          isVerified: true,
          [providerField]: id || `mock_oauth_id_${Date.now()}`,
        });
        await mockStore.getSettings(user._id);
      }
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshTokens.push(refreshToken);
    
    if (isDbConnected) {
      await user.save();
      await ActivityLog.create({
        user: user._id,
        action: 'user_login',
        details: `User logged in via mock OAuth: ${provider}`,
      });
    } else {
      await mockStore.saveUser(user);
      await mockStore.createActivity(user._id, 'user_login', `User logged in via mock OAuth: ${provider}`);
    }

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
        avatar: user.avatar,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Root API Status Check
app.get('/', (req, res) => {
  res.json({ status: 'healthy', api: 'NovaTask API Workspace', version: '1.0.0' });
});

// Catch-all 404 handler
app.use((req, res, next) => {
  next(new ErrorResponse(`Route not found: ${req.originalUrl}`, 404));
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
