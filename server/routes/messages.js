const router = require('express').Router();
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');

// Get user's conversations
router.get('/conversations', requireAuth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*, cm.closed,
        (SELECT json_agg(json_build_object('id', u.id, 'username', u.username))
         FROM conversation_members cm2 JOIN users u ON u.id = cm2.user_id
         WHERE cm2.conversation_id = c.id) AS members,
        (SELECT json_build_object('body', m.body, 'username', u2.username, 'created_at', m.created_at)
         FROM messages m LEFT JOIN users u2 ON u2.id = m.user_id
         WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message
      FROM conversations c
      JOIN conversation_members cm ON cm.conversation_id = c.id AND cm.user_id = $1
      ORDER BY c.created_at DESC
    `, [req.session.userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get conversation details + messages
router.get('/conversations/:id', requireAuth, async (req, res) => {
  try {
    const member = await db.query(
      'SELECT * FROM conversation_members WHERE conversation_id = $1 AND user_id = $2',
      [req.params.id, req.session.userId]
    );
    if (!member.rows.length) return res.status(403).json({ error: 'Not a member' });

    const conv = await db.query(`
      SELECT c.*,
        (SELECT json_agg(json_build_object('id', u.id, 'username', u.username))
         FROM conversation_members cm JOIN users u ON u.id = cm.user_id
         WHERE cm.conversation_id = c.id) AS members
      FROM conversations c WHERE c.id = $1
    `, [req.params.id]);

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

// Create conversation
router.post('/conversations', requireAuth, async (req, res) => {
  try {
    const { type, name, member_ids } = req.body;
    if (!member_ids || !member_ids.length) return res.status(400).json({ error: 'Members required' });

    // For DMs, check if one already exists between these two users
    if (type === 'dm' && member_ids.length === 1) {
      const existing = await db.query(`
        SELECT c.id FROM conversations c
        WHERE c.type = 'dm' AND (
          SELECT COUNT(*) FROM conversation_members cm
          WHERE cm.conversation_id = c.id
          AND cm.user_id IN ($1, $2)
        ) = 2
        AND (SELECT COUNT(*) FROM conversation_members cm WHERE cm.conversation_id = c.id) = 2
      `, [req.session.userId, member_ids[0]]);
      if (existing.rows.length) {
        // Reopen if closed
        await db.query(
          'UPDATE conversation_members SET closed = false WHERE conversation_id = $1 AND user_id = $2',
          [existing.rows[0].id, req.session.userId]
        );
        return res.json({ id: existing.rows[0].id, existing: true });
      }
    }

    const conv = await db.query(
      'INSERT INTO conversations (type, name, owner_id) VALUES ($1, $2, $3) RETURNING *',
      [type || 'dm', name || null, req.session.userId]
    );

    // Add creator and members
    const allMembers = [req.session.userId, ...member_ids];
    for (const uid of [...new Set(allMembers)]) {
      await db.query(
        'INSERT INTO conversation_members (conversation_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [conv.rows[0].id, uid]
      );
    }

    res.json(conv.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send message
router.post('/conversations/:id/messages', requireAuth, async (req, res) => {
  try {
    const member = await db.query(
      'SELECT * FROM conversation_members WHERE conversation_id = $1 AND user_id = $2',
      [req.params.id, req.session.userId]
    );
    if (!member.rows.length) return res.status(403).json({ error: 'Not a member' });

    const msg = await db.query(
      'INSERT INTO messages (conversation_id, user_id, body) VALUES ($1, $2, $3) RETURNING *',
      [req.params.id, req.session.userId, req.body.body]
    );

    const result = await db.query(
      'SELECT m.*, u.username FROM messages m LEFT JOIN users u ON u.id = m.user_id WHERE m.id = $1',
      [msg.rows[0].id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle open/close conversation
router.patch('/conversations/:id/toggle', requireAuth, async (req, res) => {
  try {
    await db.query(
      'UPDATE conversation_members SET closed = $1 WHERE conversation_id = $2 AND user_id = $3',
      [req.body.closed, req.params.id, req.session.userId]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add member to group
router.post('/conversations/:id/members', requireAuth, async (req, res) => {
  try {
    const conv = await db.query('SELECT * FROM conversations WHERE id = $1', [req.params.id]);
    if (!conv.rows.length || conv.rows[0].type !== 'group') return res.status(400).json({ error: 'Not a group' });
    if (conv.rows[0].owner_id !== req.session.userId) return res.status(403).json({ error: 'Not the owner' });

    await db.query(
      'INSERT INTO conversation_members (conversation_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.params.id, req.body.user_id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Kick member from group
router.delete('/conversations/:id/members/:userId', requireAuth, async (req, res) => {
  try {
    const conv = await db.query('SELECT * FROM conversations WHERE id = $1', [req.params.id]);
    if (!conv.rows.length || conv.rows[0].type !== 'group') return res.status(400).json({ error: 'Not a group' });
    if (conv.rows[0].owner_id !== req.session.userId) return res.status(403).json({ error: 'Not the owner' });

    await db.query(
      'DELETE FROM conversation_members WHERE conversation_id = $1 AND user_id = $2',
      [req.params.id, req.params.userId]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search users
router.get('/users/search', requireAuth, async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.json([]);
    const result = await db.query(
      "SELECT id, username FROM users WHERE username ILIKE $1 AND id != $2 AND banned = false LIMIT 10",
      [`%${q}%`, req.session.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
