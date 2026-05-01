const db = require('./db');

async function migrate() {
    try {
        console.log('Adding phone column to users table...');
        await db.query(`
            ALTER TABLE users 
            ADD COLUMN phone VARCHAR(20) NULL AFTER email;
        `);
        console.log('Migration successful.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
