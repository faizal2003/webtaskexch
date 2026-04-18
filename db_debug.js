const db = require('./backend/db');

async function debug() {
    try {
        const [users] = await db.query('SELECT id, username FROM users');
        console.log('Users:', users);
        
        const [tasks] = await db.query('SELECT id, title, creator_id FROM tasks');
        console.log('Tasks:', tasks);

        const [apps] = await db.query('SELECT * FROM applications');
        console.log('Applications:', apps);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debug();
