import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import * as mockStore from '../utils/mockStore.js';
import { ErrorResponse } from './errorMiddleware.js';

export const protect = async (req, res, next) => {
  let token;

  // Read token from headers or cookies
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET || 'novatask_access_secret_key_12345'
    );
    
    let user;
    const isDbConnected = mongoose.connection.readyState === 1;
    
    console.log(`[AUTH PROTECT] isDbConnected: ${isDbConnected}, decoded ID: ${decoded.id}`);

    if (isDbConnected && mongoose.Types.ObjectId.isValid(decoded.id)) {
      user = await User.findById(decoded.id);
    } else {
      user = await mockStore.findUserById(decoded.id);
    }
    
    req.user = user;
    
    if (!req.user) {
      console.log(`[AUTH PROTECT] User not found for ID: ${decoded.id}`);
      return next(new ErrorResponse('User no longer exists', 401));
    }

    next();
  } catch (error) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
};
