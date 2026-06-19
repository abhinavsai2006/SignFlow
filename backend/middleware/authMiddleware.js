import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;
  const isDocFetch = req.originalUrl && (req.originalUrl.includes('/api/docs/') || req.originalUrl.includes('/api/documents/'));

  if (isDocFetch) {
    console.log(`DOC_FETCH_START: ${req.originalUrl}`);
  }

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      console.error('Token verification error:', error.message);
      if (isDocFetch) {
        console.log(`DOC_FETCH_AUTH_FAIL: Token failed - ${error.message}`);
      }
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    if (isDocFetch) {
      console.log('DOC_FETCH_AUTH_FAIL: No token provided');
    }
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};
