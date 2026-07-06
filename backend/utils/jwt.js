import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_ACCESS_SECRET || 'novatask_access_secret_key_12345',
    { expiresIn: '1h' }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || 'novatask_refresh_secret_key_54321',
    { expiresIn: '30d' }
  );
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET || 'novatask_access_secret_key_12345'
    );
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || 'novatask_refresh_secret_key_54321'
    );
  } catch (error) {
    return null;
  }
};
