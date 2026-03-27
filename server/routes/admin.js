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

// Get all reports
router.get('/reports', requireAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT r.*, u.username AS reporter_username
      FROM reports r LEFT JOIN users u ON u.id = r.reporter_id
      ORDER BY r.resolved ASC, r.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get unresolved report count
router.get('/reports/count', requireAdmin, async (req, res) => {
  try {
    const result = await db.query('SELECT COUNT(*) FROM reports WHERE resolved = false');
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Resolve a report
router.patch('/reports/:id/resolve', requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      'UPDATE reports SET resolved = true WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Report not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: get all conversations
router.get('/conversations', requireAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*,
        (SELECT json_agg(json_build_object('id', u.id, 'username', u.username))
         FROM conversation_members cm JOIN users u ON u.id = cm.user_id
         WHERE cm.conversation_id = c.id) AS members,
        (SELECT json_build_object('body', m.body, 'username', u2.username, 'created_at', m.created_at)
         FROM messages m LEFT JOIN users u2 ON u2.id = m.user_id
         WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message
      FROM conversations c ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: get conversation messages
router.get('/conversations/:id', requireAdmin, async (req, res) => {
  try {
    const conv = await db.query(`
      SELECT c.*,
        (SELECT json_agg(json_build_object('id', u.id, 'username', u.username))
         FROM conversation_members cm JOIN users u ON u.id = cm.user_id
         WHERE cm.conversation_id = c.id) AS members
      FROM conversations c WHERE c.id = $1
    `, [req.params.id]);
    if (!conv.rows.length) return res.status(404).json({ error: 'Not found' });

    const msgs = await db.query(`
      SELECT m.*, u.username FROM messages m
      LEFT JOIN users u ON u.id = m.user_id
      WHERE m.conversation_id = $1 ORDER BY m.created_at ASC
    `, [req.params.id]);

    res.json({ conversation: conv.rows[0], messages: msgs.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: edit any message
router.patch('/messages/:id', requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      'UPDATE messages SET body = $1, edited = true WHERE id = $2 RETURNING *',
      [req.body.body, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Message not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: delete any message
router.delete('/messages/:id', requireAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM messages WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: delete a conversation
router.delete('/conversations/:id', requireAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM conversations WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
