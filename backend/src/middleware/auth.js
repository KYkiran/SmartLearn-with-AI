const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');
const logger = require('../utils/logger');

// Protect routes - require authentication
const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, config.JWT_SECRET);

      // Get user from token
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Token is valid but user not found'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated'
        });
      }

      req.user = user;
      next();

    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired'
        });
      }

      throw error;
    }

  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authentication',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Silently fail for optional auth
        logger.warn('Optional auth failed:', error.message);
      }
    }

    next();

  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    next(); // Continue even if there's an error
  }
};

// Authorize specific roles - Updated for two-role system
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

// Admin only middleware
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  next();
};

// Check if email is verified
const requireEmailVerification = (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required. Please verify your email to continue.',
      requiresEmailVerification: true
    });
  }

  next();
};

// Check if user owns resource - Updated field names
const checkResourceOwnership = (resourceModel, resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam];
      const resource = await resourceModel.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      // Check if user owns the resource or is admin
      const isOwner = resource.creator?.toString() === req.user.id || 
                     resource.user?.toString() === req.user.id ||
                     resource.author?.toString() === req.user.id;

      if (!isOwner && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only edit your own content.'
        });
      }

      req.resource = resource;
      next();

    } catch (error) {
      logger.error('Resource ownership check error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error checking resource ownership',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};

// Rate limiting for specific users (can be used with Redis in production)
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user.id;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get user's request history
    if (!requests.has(userId)) {
      requests.set(userId, []);
    }

    const userRequests = requests.get(userId);
    
    // Remove old requests outside the window
    const recentRequests = userRequests.filter(timestamp => timestamp > windowStart);
    requests.set(userId, recentRequests);

    // Check if limit exceeded
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    // Add current request
    recentRequests.push(now);

    next();
  };
};

module.exports = {
  protect,
  optionalAuth,
  authorize,
  adminOnly, // New admin-only middleware
  requireEmailVerification,
  userRateLimit,
  checkResourceOwnership
};
