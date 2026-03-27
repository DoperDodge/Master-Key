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
    console.log('Database migration complete');
  } catch (err) {
    console.log('Migration note:', err.message);
  }
}

module.exports = migrate;
