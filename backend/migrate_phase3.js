const db = require('./db');

async function migrate() {
  const connection = await db.getConnection();
  try {
    console.log("Running Phase 3 migrations...");

    await connection.query("ALTER TABLE tasks ADD COLUMN deadline DATETIME NULL");
    console.log("Added deadline column to tasks table.");

    await connection.query("ALTER TABLE tasks ADD COLUMN reward_url VARCHAR(500) NULL");
    console.log("Added reward_url column to tasks table.");

    await connection.query("ALTER TABLE applications ADD COLUMN started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
    console.log("Added started_at to applications table.");

    await connection.query("ALTER TABLE applications ADD COLUMN completed_at TIMESTAMP NULL");
    console.log("Added completed_at to applications table.");

    console.log("Phase 3 Migration complete.");
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log("Columns already exist, skipping...");
    } else {
      console.error("Migration failed:", err);
    }
  } finally {
    connection.release();
    process.exit();
  }
}

migrate();
