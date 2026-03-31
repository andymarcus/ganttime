const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    req.userEmail = payload.email;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

// Simple in-memory rate limiter
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

function rateLimit(req, res, next) {
  const key = req.ip + ':' + req.path;
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now > entry.resetTime) {
    attempts.set(key, { count: 1, resetTime: now + WINDOW_MS });
    return next();
  }

  if (entry.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return res.status(429).json({
      error: 'Too many attempts. Try again later.',
      retryAfter,
    });
  }

  entry.count++;
  next();
}

function _resetRateLimiter() { attempts.clear(); }

module.exports = { requireAuth, rateLimit, _resetRateLimiter };
