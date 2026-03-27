const db = require('./db');

async function migrate() {
  try {
    // Add is_admin column if it doesn't exist
    await db.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false
    `);
    // Add banned column if it doesn't exist
    await db.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT false
    `);
    console.log('Database migration complete');
  } catch (err) {
    console.log('Migration note:', err.message);
  }
}

module.exports = migrate;
