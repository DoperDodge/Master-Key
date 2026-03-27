# School Photo Sharing Website — Full Build Guide

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | React (Vite) |
| Backend | Node.js + Express |
| Database | PostgreSQL (Railway add-on) |
| Image Storage | Cloudflare R2 |
| Hosting | Railway |
| Auth | bcrypt + express-session |

---

## Part 1 — Set Up Your Accounts

### 1.1 GitHub

1. Create a GitHub account if you don't have one.
2. Create a new repository called `school-photos` (private is fine, Railway can access it).

### 1.2 Railway

1. Go to [railway.app](https://railway.app) and sign up with GitHub.
2. Create a new project.
3. Click **"New Service" → "GitHub Repo"** and connect your `school-photos` repo.
4. Inside the same project, click **"New" → "Database" → "PostgreSQL"**. Railway will spin up a Postgres instance and give you a connection string automatically.
5. Go to your app service's **Variables** tab. Railway auto-injects `DATABASE_URL` from the Postgres add-on — confirm it's there.

### 1.3 Cloudflare R2

1. Sign up at [cloudflare.com](https://cloudflare.com) (free plan works).
2. In the dashboard sidebar, click **R2 Object Storage**.
3. Click **Create Bucket**. Name it `school-photos`.
4. Go to **R2 → Overview → Manage R2 API Tokens → Create API Token**.
5. Give it **Object Read & Write** permissions, scoped to the `school-photos` bucket.
6. Save these three values — you'll need them:
   - **Access Key ID**
   - **Secret Access Key**
   - **Endpoint URL** (looks like `https://<account-id>.r2.cloudflarestorage.com`)

### 1.4 Add R2 Credentials to Railway

Go to your app service's **Variables** tab in Railway and add:

```
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_BUCKET_NAME=school-photos
SESSION_SECRET=make-up-a-long-random-string-here
```

---

## Part 2 — Project Structure

```
school-photos/
├── client/                  # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx            # Browse/filter posts
│   │   │   ├── Upload.jsx          # Upload form
│   │   │   ├── Login.jsx           # Login page
│   │   │   ├── Register.jsx        # Registration page
│   │   │   ├── Dashboard.jsx       # User's posts + visibility controls
│   │   │   └── PostDetail.jsx      # Single post view + comments
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── PostCard.jsx
│   │   │   ├── CommentSection.jsx
│   │   │   └── FilterBar.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── index.js             # Express app entry
│   ├── db.js                # PostgreSQL connection
│   ├── r2.js                # R2 upload helper
│   ├── routes/
│   │   ├── auth.js          # Register, login, logout, session check
│   │   ├── posts.js         # CRUD for posts + image upload
│   │   └── comments.js      # Add/list comments
│   └── middleware/
│       └── requireAuth.js   # Block unauthenticated users
├── package.json             # Root package.json (scripts to build & start)
└── .gitignore
```

---

## Part 3 — Database Schema

Connect to your Railway Postgres (Railway gives you a `psql` command or you can use the built-in query tab) and run this SQL:

```sql
-- Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(30) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Posts
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    grade VARCHAR(20) NOT NULL,        -- e.g. '10th'
    class VARCHAR(50) NOT NULL,        -- e.g. 'Chemistry'
    visibility VARCHAR(20) DEFAULT 'public',  -- public, invisible, unlisted
    created_at TIMESTAMP DEFAULT NOW()
);

-- Images (multiple per post)
CREATE TABLE images (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    r2_key TEXT NOT NULL,              -- R2 object key
    url TEXT NOT NULL,                 -- Public or presigned URL
    position INTEGER DEFAULT 0         -- Order within the post
);

-- Comments
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Part 4 — Backend Code

### 4.1 Root `package.json`

```json
{
  "name": "school-photos",
  "scripts": {
    "install:all": "cd server && npm install && cd ../client && npm install",
    "build": "cd client && npm run build",
    "start": "cd server && node index.js"
  }
}
```

### 4.2 `server/package.json`

```json
{
  "dependencies": {
    "express": "^4.18.0",
    "pg": "^8.11.0",
    "bcrypt": "^5.1.0",
    "express-session": "^1.17.3",
    "connect-pg-simple": "^9.0.0",
    "multer": "^1.4.5-lts.1",
    "@aws-sdk/client-s3": "^3.400.0",
    "dotenv": "^16.3.0",
    "cors": "^2.8.5"
  }
}
```

### 4.3 `server/db.js`

```js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = pool;
```

### 4.4 `server/r2.js`

```js
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function uploadToR2(fileBuffer, originalName, mimetype) {
  const ext = originalName.split('.').pop();
  const key = `uploads/${crypto.randomUUID()}.${ext}`;

  await s3.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: mimetype,
  }));

  // Public URL — requires making bucket public (see Part 6)
  const url = `${process.env.R2_PUBLIC_URL}/${key}`;
  return { key, url };
}

module.exports = { uploadToR2 };
```

### 4.5 `server/middleware/requireAuth.js`

```js
module.exports = function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'You must be logged in' });
  }
  next();
};
```

### 4.6 `server/routes/auth.js`

```js
const router = require('express').Router();
const bcrypt = require('bcrypt');
const db = require('../db');

// Register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  if (username.length > 30) return res.status(400).json({ error: 'Username too long' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const hash = await bcrypt.hash(password, 10);
  try {
    const result = await db.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
      [username, hash]
    );
    req.session.userId = result.rows[0].id;
    req.session.username = result.rows[0].username;
    res.json({ user: result.rows[0] });
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

  const valid = await bcrypt.compare(password, result.rows[0].password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  req.session.userId = result.rows[0].id;
  req.session.username = result.rows[0].username;
  res.json({ user: { id: result.rows[0].id, username: result.rows[0].username } });
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

// Check session
router.get('/me', (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  res.json({ user: { id: req.session.userId, username: req.session.username } });
});

module.exports = router;
```

### 4.7 `server/routes/posts.js`

```js
const router = require('express').Router();
const multer = require('multer');
const db = require('../db');
const { uploadToR2 } = require('../r2');
const requireAuth = require('../middleware/requireAuth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  }
});

const VALID_CLASSES = ['Bible', 'Spanish', 'English', 'Geometry', 'Chemistry', 'Algebra 2', 'Algebra 1'];
const VALID_GRADES = ['10th'];
const VALID_VISIBILITY = ['public', 'invisible', 'unlisted'];

// Create post with images
router.post('/', requireAuth, upload.array('images', 20), async (req, res) => {
  const { title, description, grade, class: className, visibility } = req.body;

  if (!title || !grade || !className) return res.status(400).json({ error: 'Title, grade, and class required' });
  if (!VALID_GRADES.includes(grade)) return res.status(400).json({ error: 'Invalid grade' });
  if (!VALID_CLASSES.includes(className)) return res.status(400).json({ error: 'Invalid class' });
  if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'At least one image required' });

  const postResult = await db.query(
    'INSERT INTO posts (user_id, title, description, grade, class, visibility) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [req.session.userId, title, description || '', grade, className, visibility || 'public']
  );
  const post = postResult.rows[0];

  // Upload each image to R2
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
  const { grade, class: className } = req.query;
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
```

### 4.8 `server/routes/comments.js`

```js
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
```

### 4.9 `server/index.js`

```js
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const path = require('path');
const db = require('./db');

const app = express();

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

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/comments', require('./routes/comments'));

// Serve React frontend
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
```

---

## Part 5 — Frontend (React)

### 5.1 `client/package.json`

```json
{
  "name": "school-photos-client",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0"
  }
}
```

### 5.2 `client/vite.config.js`

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000'   // Dev only — proxies to Express
    }
  }
});
```

### 5.3 Key Frontend Pages (Summarized)

The frontend is standard React with `react-router-dom`. Here's what each page does:

**Home.jsx** — Fetches `GET /api/posts?grade=...&class=...`, displays a grid of PostCards. Has a FilterBar component with dropdowns for grade and class. Clicking a card goes to `/post/:id`.

**Upload.jsx** — A form with fields for title, description, grade dropdown, class dropdown, and a multi-file input. On submit, builds a `FormData` object and POSTs to `/api/posts`. Redirects to dashboard on success.

**Login.jsx / Register.jsx** — Simple forms that POST to `/api/auth/login` or `/api/auth/register`. On success, redirect to home.

**Dashboard.jsx** — Fetches `GET /api/posts/mine/all`. Shows each post with its current visibility as a dropdown (public/invisible/unlisted). Changing it sends `PATCH /api/posts/:id/visibility`. A delete button sends `DELETE /api/posts/:id`.

**PostDetail.jsx** — Fetches `GET /api/posts/:id` and `GET /api/comments/:id`. Shows images in a gallery/carousel, title, description, class, grade, and author. Below, a comment section: if logged in, show a text input + submit button. Comments list below.

**Navbar.jsx** — Links to Home, Upload (if logged in), Dashboard (if logged in), Login/Register or Logout.

**FilterBar.jsx** — Two `<select>` dropdowns:
- Grade: `All`, `10th`
- Class: `All`, `Bible`, `Spanish`, `English`, `Geometry`, `Chemistry`, `Algebra 2`, `Algebra 1`

Changing either dropdown re-fetches the post list with query parameters.

> I'm giving you the architecture rather than 1000+ lines of React JSX. You can build these pages yourself, or ask me to generate any specific page in full.

---

## Part 6 — Make R2 Images Publicly Accessible

By default, R2 buckets are private. You need a public URL so `<img>` tags can load the images.

### Option A — R2 Custom Domain (Recommended)

1. In Cloudflare dashboard, go to **R2 → school-photos bucket → Settings**.
2. Under **Public Access**, click **Connect Domain**.
3. Add a subdomain like `images.yourdomain.com` (your domain must be on Cloudflare DNS).
4. In Railway, add the env var: `R2_PUBLIC_URL=https://images.yourdomain.com`

### Option B — R2 Public Dev URL (Quick Testing)

1. In the bucket settings, enable **R2.dev subdomain**.
2. Copy the generated URL (looks like `https://pub-abc123.r2.dev`).
3. In Railway, add: `R2_PUBLIC_URL=https://pub-abc123.r2.dev`

---

## Part 7 — Deploy to Railway

### 7.1 Configure Build & Start Commands

In your Railway service settings:

- **Build Command:** `npm run install:all && npm run build`
- **Start Command:** `npm start`

### 7.2 Create the Session Table

Railway's Postgres needs a session table for `connect-pg-simple`. In the Railway Postgres query tab, run:

```sql
CREATE TABLE "session" (
  "sid" VARCHAR NOT NULL PRIMARY KEY,
  "sess" JSON NOT NULL,
  "expire" TIMESTAMP(6) NOT NULL
);
CREATE INDEX "IDX_session_expire" ON "session" ("expire");
```

### 7.3 Push and Deploy

```bash
git add .
git commit -m "Initial build"
git push origin main
```

Railway auto-deploys on push. Watch the build logs in the Railway dashboard.

### 7.4 Generate a Domain

In your Railway service, go to **Settings → Networking → Generate Domain**. This gives you a `*.up.railway.app` URL. You can also add a custom domain.

---

## Part 8 — Visibility Logic Explained

How the four visibility states work:

| Visibility | Appears in browse/search | Accessible by direct link | Shown in your dashboard |
|---|---|---|---|
| **Public** | Yes | Yes | Yes |
| **Unlisted** | No | Yes | Yes |
| **Invisible** | No | No (404) | Yes |

- **Public** — anyone can see it everywhere.
- **Unlisted** — hidden from the main feed and filters, but anyone with the direct URL can view it (useful for sharing with specific people).
- **Invisible** — completely hidden from everyone except the author on their dashboard. Acts as a soft-delete/archive.

---

## Part 9 — Security Checklist

These are things you should do before sharing the site with real users:

1. **Rate limit uploads** — Install `express-rate-limit` and cap uploads to maybe 10 per hour per user, so nobody floods your R2 bucket.
2. **Sanitize inputs** — The code above uses parameterized queries (safe from SQL injection), but also sanitize comment text to prevent XSS. Use a library like `DOMPurify` on the frontend when rendering comments.
3. **File size limits** — Already set to 10MB per file in multer config. Adjust as needed.
4. **HTTPS** — Railway provides this automatically on their generated domains.
5. **Password requirements** — The code enforces minimum 6 characters. Consider adding a max length too.
6. **CORS** — Not needed since frontend and backend are served from the same origin.

---

## Part 10 — Cost Breakdown

| Service | Free Tier | What You Get |
|---|---|---|
| **Railway** | $5/month trial credit | Enough for a small school project |
| **Cloudflare R2** | 10 GB storage, 1M reads/month free | More than enough for class photos |
| **PostgreSQL (Railway)** | Included in Railway credit | Shared with your compute budget |

For a small class project, you'll likely stay within free/trial limits. Railway will require a paid plan ($5/month) after the trial, but the usage will be minimal.

---

## Quick Reference — API Endpoints

```
POST   /api/auth/register       { username, password }
POST   /api/auth/login          { username, password }
POST   /api/auth/logout
GET    /api/auth/me

POST   /api/posts               FormData: images[], title, description, grade, class, visibility
GET    /api/posts               ?grade=10th&class=Chemistry
GET    /api/posts/:id
GET    /api/posts/mine/all
PATCH  /api/posts/:id/visibility { visibility }
DELETE /api/posts/:id

GET    /api/comments/:postId
POST   /api/comments/:postId    { body }
```
