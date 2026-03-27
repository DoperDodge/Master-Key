const router = require('express').Router();
const db = require('../db');
const { requireAdmin } = require('../middleware/requireAuth');

// Get all users
router.get('/users', requireAdmin, async (req, res) => {
  const result = await db.query(
    'SELECT id, username, is_admin, banned, created_at FROM users ORDER BY created_at DESC'
  );
  res.json(result.rows);
});

// Ban/unban a user
router.patch('/users/:id/ban', requireAdmin, async (req, res) => {
  const { banned } = req.body;
  const userId = req.params.id;

  // Prevent banning yourself
  if (parseInt(userId) === req.session.userId) {
    return res.status(400).json({ error: 'You cannot ban yourself' });
  }

  const result = await db.query(
    'UPDATE users SET banned = $1 WHERE id = $2 AND is_admin = false RETURNING id, username, banned',
    [banned, userId]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'User not found or is an admin' });
  res.json(result.rows[0]);
});

// Admin delete any post
router.delete('/posts/:id', requireAdmin, async (req, res) => {
  const result = await db.query(
    'DELETE FROM posts WHERE id = $1 RETURNING *',
    [req.params.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Post not found' });
  res.json({ ok: true });
});

// Admin edit any post
router.patch('/posts/:id', requireAdmin, async (req, res) => {
  const { title, description, grade, class: className, visibility, key_type } = req.body;
  const result = await db.query(
    `UPDATE posts SET
      title = COALESCE($1, title),
      description = COALESCE($2, description),
      grade = COALESCE($3, grade),
      class = COALESCE($4, class),
      visibility = COALESCE($5, visibility),
      key_type = COALESCE($6, key_type)
    WHERE id = $7 RETURNING *`,
    [title, description, grade, className, visibility, key_type, req.params.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Post not found' });
  res.json(result.rows[0]);
});

// Admin get all posts
router.get('/posts', requireAdmin, async (req, res) => {
  const result = await db.query(`
    SELECT p.*, u.username,
      json_agg(json_build_object('id', i.id, 'url', i.url, 'position', i.position) ORDER BY i.position) AS images
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN images i ON i.post_id = p.id
    GROUP BY p.id, u.username
    ORDER BY p.created_at DESC
  `);
  res.json(result.rows);
});

module.exports = router;
