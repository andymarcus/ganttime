const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { app, resetDb, registerUser } = require('./helpers');

describe('GET /api/timezones', () => {
  beforeEach(() => resetDb());

  it('returns empty array for new user', async () => {
    const { cookie } = await registerUser(request);

    const res = await request(app)
      .get('/api/timezones')
      .set('Cookie', cookie);

    assert.equal(res.status, 200);
    assert.deepEqual(res.body.timezones, []);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/timezones');
    assert.equal(res.status, 401);
  });
});

describe('PUT /api/timezones', () => {
  let cookie;

  beforeEach(async () => {
    resetDb();
    const result = await registerUser(request);
    cookie = result.cookie;
  });

  it('saves and retrieves timezones', async () => {
    const timezones = ['America/New_York', 'Europe/London', 'Asia/Tokyo'];

    const putRes = await request(app)
      .put('/api/timezones')
      .set('Cookie', cookie)
      .send({ timezones });

    assert.equal(putRes.status, 200);
    assert.deepEqual(putRes.body, { ok: true });

    const getRes = await request(app)
      .get('/api/timezones')
      .set('Cookie', cookie);

    assert.equal(getRes.status, 200);
    assert.deepEqual(getRes.body.timezones, timezones);
  });

  it('overwrites previous timezones on update', async () => {
    await request(app)
      .put('/api/timezones')
      .set('Cookie', cookie)
      .send({ timezones: ['America/New_York'] });

    await request(app)
      .put('/api/timezones')
      .set('Cookie', cookie)
      .send({ timezones: ['Europe/Paris', 'Asia/Seoul'] });

    const res = await request(app)
      .get('/api/timezones')
      .set('Cookie', cookie);

    assert.deepEqual(res.body.timezones, ['Europe/Paris', 'Asia/Seoul']);
  });

  it('allows saving an empty array', async () => {
    await request(app)
      .put('/api/timezones')
      .set('Cookie', cookie)
      .send({ timezones: ['America/New_York'] });

    const putRes = await request(app)
      .put('/api/timezones')
      .set('Cookie', cookie)
      .send({ timezones: [] });

    assert.equal(putRes.status, 200);

    const getRes = await request(app)
      .get('/api/timezones')
      .set('Cookie', cookie);

    assert.deepEqual(getRes.body.timezones, []);
  });

  it('rejects non-array body', async () => {
    const res = await request(app)
      .put('/api/timezones')
      .set('Cookie', cookie)
      .send({ timezones: 'not-an-array' });

    assert.equal(res.status, 400);
    assert.match(res.body.error, /must be an array/);
  });

  it('rejects more than 50 timezones', async () => {
    const timezones = Array.from({ length: 51 }, (_, i) => 'America/New_York');

    const res = await request(app)
      .put('/api/timezones')
      .set('Cookie', cookie)
      .send({ timezones });

    assert.equal(res.status, 400);
    assert.match(res.body.error, /Maximum 50/);
  });

  it('rejects invalid timezone strings', async () => {
    const res = await request(app)
      .put('/api/timezones')
      .set('Cookie', cookie)
      .send({ timezones: ['America/New_York', 'Not/A_Real_Zone'] });

    assert.equal(res.status, 400);
    assert.match(res.body.error, /Invalid timezone/);
  });

  it('rejects non-string values in array', async () => {
    const res = await request(app)
      .put('/api/timezones')
      .set('Cookie', cookie)
      .send({ timezones: [123, null] });

    assert.equal(res.status, 400);
    assert.match(res.body.error, /Invalid timezone/);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app)
      .put('/api/timezones')
      .send({ timezones: ['America/New_York'] });

    assert.equal(res.status, 401);
  });

  it('isolates timezones between users', async () => {
    // User 1 saves timezones
    await request(app)
      .put('/api/timezones')
      .set('Cookie', cookie)
      .send({ timezones: ['America/New_York'] });

    // Register user 2
    const { cookie: cookie2 } = await registerUser(request, 'other@example.com', 'password456');

    // User 2 saves different timezones
    await request(app)
      .put('/api/timezones')
      .set('Cookie', cookie2)
      .send({ timezones: ['Europe/London'] });

    // Verify isolation
    const res1 = await request(app)
      .get('/api/timezones')
      .set('Cookie', cookie);
    assert.deepEqual(res1.body.timezones, ['America/New_York']);

    const res2 = await request(app)
      .get('/api/timezones')
      .set('Cookie', cookie2);
    assert.deepEqual(res2.body.timezones, ['Europe/London']);
  });
});
