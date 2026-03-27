const router = require('express').Router();
const multer = require('multer');
const db = require('../db');
const { uploadToR2 } = require('../r2');
const requireAuth = require('../middleware/requireAuth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  }
});

const GRADE_CLASSES = {
  '9th': ['Algebra'],
  '10th': ['Bible', 'Spanish', 'English', 'Geometry', 'Chemistry', 'Algebra 2', 'Algebra 1'],
  '11th': ['Algebra 2'],
  '12th': [],
};

const VALID_GRADES = Object.keys(GRADE_CLASSES);
const ALL_CLASSES = [...new Set(Object.values(GRADE_CLASSES).flat())];
const VALID_VISIBILITY = ['public', 'invisible', 'unlisted'];
const VALID_KEY_TYPES = ['Homework', 'Classwork', 'Notes', 'Quiz', 'Test', 'Miscellaneous', 'Lab'];

// Create post with images
router.post('/', requireAuth, upload.array('images', 20), async (req, res) => {
  const { title, description, grade, class: className, visibility, key_type } = req.body;

  if (!title || !grade || !className) return res.status(400).json({ error: 'Title, grade, and class required' });
  if (!VALID_GRADES.includes(grade)) return res.status(400).json({ error: 'Invalid grade' });
  const gradeClasses = GRADE_CLASSES[grade] || [];
  if (!gradeClasses.includes(className)) return res.status(400).json({ error: 'Invalid class for this grade' });
  if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'At least one image required' });
  if (key_type && !VALID_KEY_TYPES.includes(key_type)) return res.status(400).json({ error: 'Invalid answer key type' });
  if (key_type === 'Lab' && className !== 'Chemistry') return res.status(400).json({ error: 'Lab type is only for Chemistry' });

  const postResult = await db.query(
    'INSERT INTO posts (user_id, title, description, grade, class, visibility, key_type) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
    [req.session.userId, title, description || '', grade, className, visibility || 'public', key_type || null]
  );
  const post = postResult.rows[0];

  const imageRecords = [];
  for (let i = 0; i < req.files.length; i++) {
    const file = req.files[i];
    const { key, url } = await uploadToR2(file.buffer, file.originalname, file.mimetype);
    const imgResult = await db.query(
      'INSERT INTO images (post_id, r2_key, url, position) VALUES ($1,$2,$3,$4) RETURNING *',
      [post.id, key, url, i]
    );
    imageRecords.push(imgResult.rows[0]);
  }

  res.json({ post, images: imageRecords });
});

// List posts (with filters)
router.get('/', async (req, res) => {
  const { grade, class: className, key_type } = req.query;
  let query = `
    SELECT p.*, u.username,
      json_agg(json_build_object('id', i.id, 'url', i.url, 'position', i.position) ORDER BY i.position) AS images
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN images i ON i.post_id = p.id
    WHERE p.visibility = 'public'
  `;
  const params = [];

  if (grade) {
    params.push(grade);
    query += ` AND p.grade = $${params.length}`;
  }
  if (className) {
    params.push(className);
    query += ` AND p.class = $${params.length}`;
  }
  if (key_type) {
    params.push(key_type);
    query += ` AND p.key_type = $${params.length}`;
  }

  query += ' GROUP BY p.id, u.username ORDER BY p.created_at DESC';

  const result = await db.query(query, params);
  res.json(result.rows);
});

// Get single post (including unlisted — only invisible is hidden)
router.get('/:id', async (req, res) => {
  const result = await db.query(`
    SELECT p.*, u.username,
      json_agg(json_build_object('id', i.id, 'url', i.url, 'position', i.position) ORDER BY i.position) AS images
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN images i ON i.post_id = p.id
    WHERE p.id = $1 AND p.visibility != 'invisible'
    GROUP BY p.id, u.username
  `, [req.params.id]);

  if (!result.rows.length) return res.status(404).json({ error: 'Post not found' });
  res.json(result.rows[0]);
});

// Get current user's posts (dashboard)
router.get('/mine/all', requireAuth, async (req, res) => {
  const result = await db.query(`
    SELECT p.*,
      json_agg(json_build_object('id', i.id, 'url', i.url, 'position', i.position) ORDER BY i.position) AS images
    FROM posts p
    LEFT JOIN images i ON i.post_id = p.id
    WHERE p.user_id = $1
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `, [req.session.userId]);
  res.json(result.rows);
});

// Update visibility
router.patch('/:id/visibility', requireAuth, async (req, res) => {
  const { visibility } = req.body;
  if (!VALID_VISIBILITY.includes(visibility)) return res.status(400).json({ error: 'Invalid visibility' });

  const result = await db.query(
    'UPDATE posts SET visibility = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
    [visibility, req.params.id, req.session.userId]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Post not found or not yours' });
  res.json(result.rows[0]);
});

// Delete post
router.delete('/:id', requireAuth, async (req, res) => {
  const result = await db.query(
    'DELETE FROM posts WHERE id = $1 AND user_id = $2 RETURNING *',
    [req.params.id, req.session.userId]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Post not found or not yours' });
  res.json({ ok: true });
});

module.exports = router;
