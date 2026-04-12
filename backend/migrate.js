const db = require('./db');

async function migrate() {
    try {
        console.log('Running migrations...');
        await db.query("ALTER TABLE users ADD COLUMN role ENUM('user', 'admin') DEFAULT 'user'");
        console.log('Added role column to users table.');
    } catch(err) {
        if(err.code === 'ER_DUP_FIELDNAME') console.log('Role column already exists.');
        else console.error(err);
    }

    try {
        await db.query("ALTER TABLE applications ADD COLUMN proof_image VARCHAR(255) NULL");
        console.log('Added proof_image column to applications table.');
    } catch(err) {
        if(err.code === 'ER_DUP_FIELDNAME') console.log('Proof_image column already exists.');
        else console.error(err);
    }
    
    console.log('Migration complete.');
    process.exit(0);
}
migrate();
