const express = require('express');
const db = require('../lib/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Validate IANA timezone string
function isValidTz(tz) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

// Get user's timezones
router.get('/timezones', requireAuth, (req, res) => {
  const row = db.prepare(
    'SELECT timezones_json FROM user_timezones WHERE user_id = ?'
  ).get(req.userId);

  const timezones = row ? JSON.parse(row.timezones_json) : [];
  res.json({ timezones });
});

// Save user's timezones
router.put('/timezones', requireAuth, (req, res) => {
  const { timezones } = req.body || {};

  if (!Array.isArray(timezones)) {
    return res.status(400).json({ error: 'timezones must be an array' });
  }

  if (timezones.length > 50) {
    return res.status(400).json({ error: 'Maximum 50 timezones allowed' });
  }

  // Validate each timezone
  for (const tz of timezones) {
    if (typeof tz !== 'string' || !isValidTz(tz)) {
      return res.status(400).json({ error: `Invalid timezone: ${tz}` });
    }
  }

  const json = JSON.stringify(timezones);
  const now = Date.now();

  // Upsert
  const existing = db.prepare('SELECT user_id FROM user_timezones WHERE user_id = ?').get(req.userId);
  if (existing) {
    db.prepare('UPDATE user_timezones SET timezones_json = ?, updated_at = ? WHERE user_id = ?')
      .run(json, now, req.userId);
  } else {
    db.prepare('INSERT INTO user_timezones (user_id, timezones_json, updated_at) VALUES (?, ?, ?)')
      .run(req.userId, json, now);
  }

  res.json({ ok: true });
});

module.exports = router;
