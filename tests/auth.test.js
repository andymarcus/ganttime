const { describe, it, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { app, resetDb, getCookie, registerUser } = require('./helpers');

describe('POST /api/register', () => {
  beforeEach(() => resetDb());

  it('registers a new user and sets a cookie', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ email: 'new@example.com', password: 'password123' });

    assert.equal(res.status, 200);
    assert.equal(res.body.email, 'new@example.com');
    const cookie = getCookie(res);
    assert.ok(cookie, 'should set a token cookie');
  });

  it('normalizes email to lowercase', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ email: 'Test@Example.COM', password: 'password123' });

    assert.equal(res.status, 200);
    assert.equal(res.body.email, 'test@example.com');
  });

  it('rejects missing email', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ password: 'password123' });

    assert.equal(res.status, 400);
    assert.match(res.body.error, /Email and password are required/);
  });

  it('rejects missing password', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ email: 'a@b.com' });

    assert.equal(res.status, 400);
    assert.match(res.body.error, /Email and password are required/);
  });

  it('rejects invalid email format', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ email: 'not-an-email', password: 'password123' });

    assert.equal(res.status, 400);
    assert.match(res.body.error, /Invalid email/);
  });

  it('rejects password shorter than 8 chars', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ email: 'a@b.com', password: 'short' });

    assert.equal(res.status, 400);
    assert.match(res.body.error, /at least 8 characters/);
  });

  it('rejects duplicate email', async () => {
    await request(app)
      .post('/api/register')
      .send({ email: 'dup@example.com', password: 'password123' });

    const res = await request(app)
      .post('/api/register')
      .send({ email: 'dup@example.com', password: 'password456' });

    assert.equal(res.status, 409);
    assert.match(res.body.error, /already exists/);
  });
});

describe('POST /api/login', () => {
  beforeEach(async () => {
    resetDb();
    await request(app)
      .post('/api/register')
      .send({ email: 'user@example.com', password: 'password123' });
  });

  it('logs in with valid credentials', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'user@example.com', password: 'password123' });

    assert.equal(res.status, 200);
    assert.equal(res.body.email, 'user@example.com');
    assert.ok(getCookie(res), 'should set token cookie');
  });

  it('login is case-insensitive for email', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'USER@Example.COM', password: 'password123' });

    assert.equal(res.status, 200);
    assert.equal(res.body.email, 'user@example.com');
  });

  it('rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'user@example.com', password: 'wrongpassword' });

    assert.equal(res.status, 401);
    assert.match(res.body.error, /Invalid email or password/);
  });

  it('rejects non-existent user', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'nobody@example.com', password: 'password123' });

    assert.equal(res.status, 401);
    assert.match(res.body.error, /Invalid email or password/);
  });

  it('rejects missing fields', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({});

    assert.equal(res.status, 400);
    assert.match(res.body.error, /required/);
  });
});

describe('POST /api/logout', () => {
  it('clears the token cookie', async () => {
    const res = await request(app).post('/api/logout');

    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { ok: true });
    // Cookie should be cleared (expires in the past)
    const cookies = res.headers['set-cookie'];
    assert.ok(cookies, 'should have set-cookie header');
    const tokenCookie = cookies.find(c => c.startsWith('token='));
    assert.ok(tokenCookie, 'should clear token cookie');
  });
});

describe('GET /api/me', () => {
  beforeEach(() => resetDb());

  it('returns user info when authenticated', async () => {
    const { cookie } = await registerUser(request, 'me@example.com', 'password123');

    const res = await request(app)
      .get('/api/me')
      .set('Cookie', cookie);

    assert.equal(res.status, 200);
    assert.equal(res.body.email, 'me@example.com');
  });

  it('returns 401 without cookie', async () => {
    const res = await request(app).get('/api/me');

    assert.equal(res.status, 401);
    assert.match(res.body.error, /Not authenticated/);
  });

  it('returns 401 with invalid cookie', async () => {
    const res = await request(app)
      .get('/api/me')
      .set('Cookie', 'token=invalid.jwt.token');

    assert.equal(res.status, 401);
    assert.match(res.body.error, /Invalid or expired/);
  });
});
