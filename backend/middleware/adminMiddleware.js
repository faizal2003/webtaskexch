const jwt = require('jsonwebtoken');
const db = require('../db');

module.exports = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Access denied: No token provided' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; 
        
        const [users] = await db.query('SELECT role FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0 || users[0].role !== 'admin') {
             return res.status(403).json({ error: 'Access denied: Requires admin role' });
        }
        
        next();
    } catch(err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};
