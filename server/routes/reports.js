const router = require('express').Router();
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');

// Create a report
router.post('/', requireAuth, async (req, res) => {
  try {
    const { report_type, target_id, reason } = req.body;
    if (!report_type || !target_id || !reason) {
      return res.status(400).json({ error: 'report_type, target_id, and reason are required' });
    }
    if (!['post', 'message', 'user'].includes(report_type)) {
      return res.status(400).json({ error: 'Invalid report type' });
    }
    const result = await db.query(
      'INSERT INTO reports (reporter_id, report_type, target_id, reason) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.session.userId, report_type, target_id, reason]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
