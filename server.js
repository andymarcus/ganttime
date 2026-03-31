const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const { initDb } = require('./db/init');
const authRoutes = require('./routes/auth');
const timezoneRoutes = require('./routes/timezones');

// Load .env manually (avoid dotenv dependency)
const fs = require('fs');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx > 0) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const app = express();
app.use(express.json());
app.use(cookieParser());

// API routes
app.use('/api', authRoutes);
app.use('/api', timezoneRoutes);

// Serve static frontend
app.use(express.static(__dirname, { index: 'index.html' }));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Init DB and start
initDb();

// Export app for testing; only listen when run directly
module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}
