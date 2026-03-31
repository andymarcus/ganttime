const path = require('path');
const fs = require('fs');

// Set test env vars before any app code loads
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.COOKIE_SECRET = 'test-cookie-secret';
process.env.NODE_ENV = 'test';

const db = require('../lib/db');
const { initDb } = require('../db/init');

// Ensure tables exist on first load
initDb();

const app = require('../server');

// Wipe tables AND clear rate limiter state
function resetDb() {
  db.exec('DELETE FROM user_timezones');
  db.exec('DELETE FROM users');
  // Clear the in-memory rate limiter
  const { _resetRateLimiter } = require('../middleware/auth');
  if (_resetRateLimiter) _resetRateLimiter();
}

// Extract token cookie value from response headers
function getCookie(res) {
  const cookies = res.headers['set-cookie'];
  if (!cookies) return null;
  const tokenCookie = cookies.find(c => c.startsWith('token='));
  if (!tokenCookie) return null;
  return tokenCookie.split(';')[0]; // "token=xxx"
}

// Register a user and return { res, cookie }
async function registerUser(request, email = 'test@example.com', password = 'password123') {
  const res = await request(app)
    .post('/api/register')
    .send({ email, password });
  return { res, cookie: getCookie(res) };
}

module.exports = { app, db, resetDb, getCookie, registerUser };
