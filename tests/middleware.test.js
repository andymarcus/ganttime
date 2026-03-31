const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app, resetDb } = require('./helpers');

describe('requireAuth middleware', () => {
  beforeEach(() => resetDb());

  it('rejects requests with no cookie', async () => {
    const res = await request(app).get('/api/me');
    assert.equal(res.status, 401);
    assert.match(res.body.error, /Not authenticated/);
  });

  it('rejects requests with malformed JWT', async () => {
    const res = await request(app)
      .get('/api/me')
      .set('Cookie', 'token=not.a.jwt');
    assert.equal(res.status, 401);
    assert.match(res.body.error, /Invalid or expired/);
  });

  it('rejects requests with JWT signed by wrong secret', async () => {
    const fakeToken = jwt.sign(
      { userId: 1, email: 'fake@example.com' },
      'wrong-secret',
      { expiresIn: '7d' }
    );

    const res = await request(app)
      .get('/api/me')
      .set('Cookie', `token=${fakeToken}`);
    assert.equal(res.status, 401);
  });

  it('rejects expired JWT', async () => {
    const expiredToken = jwt.sign(
      { userId: 1, email: 'expired@example.com' },
      process.env.JWT_SECRET,
      { expiresIn: '-1s' }
    );

    const res = await request(app)
      .get('/api/me')
      .set('Cookie', `token=${expiredToken}`);
    assert.equal(res.status, 401);
  });

  it('accepts valid JWT and populates req.userId/req.userEmail', async () => {
    // Register to get a real user + token
    const regRes = await request(app)
      .post('/api/register')
      .send({ email: 'valid@example.com', password: 'password123' });

    const cookies = regRes.headers['set-cookie'];
    const tokenCookie = cookies.find(c => c.startsWith('token=')).split(';')[0];

    const res = await request(app)
      .get('/api/me')
      .set('Cookie', tokenCookie);

    assert.equal(res.status, 200);
    assert.equal(res.body.email, 'valid@example.com');
  });
});

describe('rateLimit middleware', () => {
  beforeEach(() => resetDb());

  it('allows requests under the limit', async () => {
    // Register a user so we can attempt logins
    await request(app)
      .post('/api/register')
      .send({ email: 'rate@example.com', password: 'password123' });

    // 4 failed logins should all get 401, not 429
    for (let i = 0; i < 4; i++) {
      const res = await request(app)
        .post('/api/login')
        .send({ email: 'rate@example.com', password: 'wrong' });
      assert.equal(res.status, 401, `attempt ${i + 1} should be 401`);
    }
  });

  it('blocks after exceeding the limit', async () => {
    await request(app)
      .post('/api/register')
      .send({ email: 'blocked@example.com', password: 'password123' });

    // Exhaust the limit
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/login')
        .send({ email: 'blocked@example.com', password: 'wrong' });
    }

    // Next attempt should be rate limited
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'blocked@example.com', password: 'wrong' });

    assert.equal(res.status, 429);
    assert.match(res.body.error, /Too many attempts/);
    assert.ok(res.body.retryAfter > 0, 'should include retryAfter');
  });
});
