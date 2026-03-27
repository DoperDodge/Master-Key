const db = require('./db');

async function migrate() {
  try {
    await db.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false
    `);
    await db.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT false
    `);
    await db.query(`
      ALTER TABLE posts ADD COLUMN IF NOT EXISTS key_type VARCHAR(30)
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        type VARCHAR(10) NOT NULL DEFAULT 'dm',
        name VARCHAR(100),
        owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS conversation_members (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        closed BOOLEAN DEFAULT false,
        joined_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(conversation_id, user_id)
      )
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        body TEXT NOT NULL,
        edited BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        reporter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        report_type VARCHAR(20) NOT NULL,
        target_id INTEGER NOT NULL,
        reason TEXT NOT NULL,
        resolved BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('Database migration complete');
  } catch (err) {
    console.log('Migration note:', err.message);
  }
}

module.exports = migrate;
