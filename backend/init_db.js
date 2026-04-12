const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function init() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });

        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
        const statements = schema.split(';').filter(stmt => stmt.trim());

        for (let stmt of statements) {
            await connection.query(stmt);
        }

        console.log('Database initialized successfully');
        await connection.end();
    } catch(err) {
        console.error('Error initializing database', err);
    }
}
init();
