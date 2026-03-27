require('dotenv').config();
const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const path = require('path');
const db = require('./db');
const bcrypt = require('bcrypt');
const migrate = require('./migrate');

const app = express();

// Trust Railway's reverse proxy so secure cookies work
app.set('trust proxy', 1);

app.use(express.json());

// Sessions stored in Postgres so they survive restarts
app.use(session({
  store: new PgSession({ pool: db }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}));

// Run migrations then seed admin account
(async () => {
  await migrate();
  try {
    const existing = await db.query('SELECT id FROM users WHERE username = $1', ['Admin']);
    if (!existing.rows.length) {
      const hash = await bcrypt.hash('Rocco3097', 10);
      await db.query(
        'INSERT INTO users (username, password_hash, is_admin) VALUES ($1, $2, true)',
        ['Admin', hash]
      );
      console.log('Admin account created');
    } else {
      await db.query('UPDATE users SET is_admin = true WHERE username = $1', ['Admin']);
    }
  } catch (err) {
    console.log('Admin seed note:', err.message);
  }
})();

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/reports', require('./routes/reports'));

// Serve React frontend
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
