import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const createRateLimiter = ({ windowMs, max, message, keyGenerator }) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    validate: {
      keyGeneratorIpFallback: false,
      xForwardedForHeader: false,
    },
    handler: (req, res, next, options) => {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: message || 'Too many requests, please try again later.',
        },
      });
    },
  });
};

// 1. Login rate limit: 5 attempts / 15 min per IP + email
export const loginRateLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts. Please try again after 15 minutes.',
  keyGenerator: (req) => {
    const email = (req.body?.email || '').toLowerCase().trim();
    const clientIp = req.ip || req.socket?.remoteAddress || 'unknown';
    return `${clientIp}_${email}`;
  },
});

// 2. Refresh token rate limit: 30 / 15 min per IP
export const refreshRateLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: 'Too many token refresh attempts. Please slow down.',
});

// 3. User creation limit: 20 / hour per user
export const createUserRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'User creation limit exceeded. Please try again in an hour.',
  keyGenerator: (req) => {
    return req.user?.id ? `user_${req.user.id}` : (req.ip || 'unknown');
  },
});

// 4. Global API limit: 100 / min per IP
export const globalRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Too many requests. Please slow down.',
});

// 5. Sync rate limit: 5 / hour per user/IP
export const syncRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Sync limit exceeded. Maximum 5 syncs per hour.',
  keyGenerator: (req) => {
    return req.user?.id ? `sync_${req.user.id}` : (req.ip || 'unknown');
  },
});

