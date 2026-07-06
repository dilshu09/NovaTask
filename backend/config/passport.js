import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import mongoose from 'mongoose';
import User from '../models/User.js';
import UserSettings from '../models/UserSettings.js';
import ActivityLog from '../models/ActivityLog.js';
import * as mockStore from '../utils/mockStore.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'google_testing_client_secret_xyz',
      callbackURL: '/api/auth/google/callback',
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        const name = profile.displayName || profile.name?.givenName || 'Google User';
        const googleId = profile.id;
        const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : '';

        if (!email) {
          return done(new Error('No email returned from Google'), null);
        }

        const isDbConnected = mongoose.connection.readyState === 1;
        let user;

        if (isDbConnected) {
          user = await User.findOne({ email });
        } else {
          user = await mockStore.findUserByEmail(email);
        }

        if (user) {
          // If user exists but doesn't have googleId linked, link it
          if (!user.googleId) {
            user.googleId = googleId;
            user.isVerified = true;
            if (isDbConnected) {
              await user.save();
            } else {
              await mockStore.saveUser(user);
            }
          }
          return done(null, user);
        }

        // Create new user
        if (isDbConnected) {
          user = await User.create({
            name,
            email,
            googleId,
            isVerified: true,
            avatar,
          });
          await UserSettings.create({ user: user._id });
          await ActivityLog.create({
            user: user._id,
            action: 'user_login',
            details: 'User registered and logged in via Google OAuth.',
          });
        } else {
          user = await mockStore.createUser({
            name,
            email,
            googleId,
            isVerified: true,
            avatar,
          });
          await mockStore.getSettings(user._id);
          await mockStore.createActivity(user._id, 'user_login', 'User registered and logged in via Google OAuth.');
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id || user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    let user;
    if (isDbConnected && mongoose.Types.ObjectId.isValid(id)) {
      user = await User.findById(id);
    } else {
      user = await mockStore.findUserById(id);
    }
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
