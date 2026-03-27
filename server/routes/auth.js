const router = require('express').Router();
const bcrypt = require('bcrypt');
const db = require('../db');

// Register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  if (username.length > 30) return res.status(400).json({ error: 'Username too long' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  if (username.toLowerCase() === 'admin') return res.status(400).json({ error: 'That username is reserved' });

  const hash = await bcrypt.hash(password, 10);
  try {
    const result = await db.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, is_admin',
      [username, hash]
    );
    req.session.userId = result.rows[0].id;
    req.session.username = result.rows[0].username;
    req.session.isAdmin = result.rows[0].is_admin || false;
    res.json({ user: { id: result.rows[0].id, username: result.rows[0].username, is_admin: result.rows[0].is_admin || false } });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Username already taken' });
    throw err;
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
  if (!result.rows.length) return res.status(401).json({ error: 'Invalid credentials' });

  const user = result.rows[0];
  if (user.banned) return res.status(403).json({ error: 'This account has been banned' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  req.session.userId = user.id;
  req.session.username = user.username;
  req.session.isAdmin = user.is_admin || false;
  res.json({ user: { id: user.id, username: user.username, is_admin: user.is_admin || false } });
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

// Check session
router.get('/me', (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  res.json({ user: { id: req.session.userId, username: req.session.username, is_admin: req.session.isAdmin || false } });
});

module.exports = router;
