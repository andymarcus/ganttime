const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { app, resetDb, getCookie } = require('./helpers');

describe('Full user lifecycle', () => {
  beforeEach(() => resetDb());

  it('register → save timezones → logout → login → timezones restored', async () => {
    // 1. Register
    const regRes = await request(app)
      .post('/api/register')
      .send({ email: 'lifecycle@example.com', password: 'password123' });
    assert.equal(regRes.status, 200);
    const cookie = getCookie(regRes);
    assert.ok(cookie);

    // 2. Save timezones
    const tzList = ['America/Los_Angeles', 'Europe/Berlin', 'Asia/Singapore'];
    const saveRes = await request(app)
      .put('/api/timezones')
      .set('Cookie', cookie)
      .send({ timezones: tzList });
    assert.equal(saveRes.status, 200);

    // 3. Logout
    const logoutRes = await request(app)
      .post('/api/logout')
      .set('Cookie', cookie);
    assert.equal(logoutRes.status, 200);

    // 4. Verify logged out
    const meRes = await request(app)
      .get('/api/me')
      .set('Cookie', 'token=cleared');
    assert.equal(meRes.status, 401);

    // 5. Login again
    const loginRes = await request(app)
      .post('/api/login')
      .send({ email: 'lifecycle@example.com', password: 'password123' });
    assert.equal(loginRes.status, 200);
    const cookie2 = getCookie(loginRes);

    // 6. Timezones should be restored
    const getRes = await request(app)
      .get('/api/timezones')
      .set('Cookie', cookie2);
    assert.equal(getRes.status, 200);
    assert.deepEqual(getRes.body.timezones, tzList);
  });

  it('two users have independent timezone lists', async () => {
    // User A
    const regA = await request(app)
      .post('/api/register')
      .send({ email: 'alice@example.com', password: 'password123' });
    const cookieA = getCookie(regA);

    // User B
    const regB = await request(app)
      .post('/api/register')
      .send({ email: 'bob@example.com', password: 'password456' });
    const cookieB = getCookie(regB);

    // Save different timezones
    await request(app)
      .put('/api/timezones')
      .set('Cookie', cookieA)
      .send({ timezones: ['America/New_York', 'America/Chicago'] });

    await request(app)
      .put('/api/timezones')
      .set('Cookie', cookieB)
      .send({ timezones: ['Asia/Tokyo'] });

    // Verify isolation
    const resA = await request(app)
      .get('/api/timezones')
      .set('Cookie', cookieA);
    assert.deepEqual(resA.body.timezones, ['America/New_York', 'America/Chicago']);

    const resB = await request(app)
      .get('/api/timezones')
      .set('Cookie', cookieB);
    assert.deepEqual(resB.body.timezones, ['Asia/Tokyo']);
  });

  it('serves index.html at root', async () => {
    const res = await request(app).get('/');
    assert.equal(res.status, 200);
    assert.ok(res.text.includes('Timezone Gantt'));
  });

  it('cookie is httpOnly', async () => {
    const regRes = await request(app)
      .post('/api/register')
      .send({ email: 'cookie@example.com', password: 'password123' });

    const cookies = regRes.headers['set-cookie'];
    const tokenCookie = cookies.find(c => c.startsWith('token='));
    assert.ok(tokenCookie.includes('HttpOnly'), 'token cookie should be HttpOnly');
  });

  it('cookie has SameSite=Strict', async () => {
    const regRes = await request(app)
      .post('/api/register')
      .send({ email: 'samesite@example.com', password: 'password123' });

    const cookies = regRes.headers['set-cookie'];
    const tokenCookie = cookies.find(c => c.startsWith('token='));
    assert.ok(tokenCookie.includes('SameSite=Strict'), 'cookie should be SameSite=Strict');
  });
});
