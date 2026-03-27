const router = require('express').Router();
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');

// Get comments for a post
router.get('/:postId', async (req, res) => {
  const result = await db.query(`
    SELECT c.*, u.username
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.post_id = $1
    ORDER BY c.created_at ASC
  `, [req.params.postId]);
  res.json(result.rows);
});

// Add comment (logged-in only)
router.post('/:postId', requireAuth, async (req, res) => {
  const { body } = req.body;
  if (!body || !body.trim()) return res.status(400).json({ error: 'Comment cannot be empty' });

  const result = await db.query(
    'INSERT INTO comments (post_id, user_id, body) VALUES ($1, $2, $3) RETURNING *',
    [req.params.postId, req.session.userId, body.trim()]
  );

  // Attach username for the response
  result.rows[0].username = req.session.username;
  res.json(result.rows[0]);
});

module.exports = router;
