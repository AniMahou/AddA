import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../config/redis.js';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for auth routes
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 requests per hour
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after an hour'
  },
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Message rate limiter
export const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each user to 30 messages per minute
  message: {
    success: false,
    message: 'Message limit reached, please slow down'
  },
  keyGenerator: (req) => req.user?._id?.toString() || ipKeyGenerator(req), // Rate limit by user ID if available
});

// File upload limiter
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each user to 10 uploads per hour
  message: {
    success: false,
    message: 'Upload limit reached, please try again later'
  },
  keyGenerator: (req) => req.user?._id?.toString() || ipKeyGenerator(req),
});

// AI feature limiter (to control costs)
export const aiLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 1 day
  max: 50, // Limit each user to 50 AI requests per day
  message: {
    success: false,
    message: 'Daily AI request limit reached'
  },
  keyGenerator: (req) => req.user?._id?.toString() || ipKeyGenerator(req),
});

// Redis-backed limiter for distributed environments
export const createRedisLimiter = (options = {}) => {
  if (!redisClient) {
    // Fallback to memory store if Redis is not available
    return rateLimit({
      windowMs: options.windowMs || 15 * 60 * 1000,
      max: options.max || 100,
      message: options.message || 'Too many requests',
    });
  }

  return rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
    }),
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    message: options.message || 'Too many requests',
    ...options
  });
};

// Dynamic rate limiter based on user role
export const dynamicRateLimiter = (req, res, next) => {
  // Different limits for different user types
  const limits = {
    admin: 1000,
    premium: 500,
    free: 100,
    guest: 50
  };

  const userRole = req.user?.role || 'guest';
  const limit = limits[userRole] || 100;

  // Implement sliding window rate limiting
  // This is a simplified version - in production, use Redis
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: limit,
    keyGenerator: (req) => req.user?._id?.toString() || ipKeyGenerator(req),
    message: {
      success: false,
      message: `Rate limit of ${limit} requests per 15 minutes exceeded`
    }
  });

  return limiter(req, res, next);
};