const db = require('./db');

async function migrate() {
    try {
        console.log('Adding email and OTP columns to users table...');
        await db.query(`
            ALTER TABLE users 
            ADD COLUMN email VARCHAR(255) UNIQUE AFTER username,
            ADD COLUMN otp VARCHAR(6) NULL,
            ADD COLUMN otp_expires_at TIMESTAMP NULL,
            ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
        `);
        console.log('Migration successful.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
