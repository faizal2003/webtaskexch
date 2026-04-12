const express = require('express');
const db = require('../db');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

// Get all users
router.get('/users', adminMiddleware, async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, username, points, role, created_at FROM users ORDER BY created_at DESC');
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete a user
router.delete('/users/:id', adminMiddleware, async (req, res) => {
    try {
        const userId = req.params.id;
        // Check to not delete self trivially
        if (userId == req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });

        await db.query('DELETE FROM users WHERE id = ?', [userId]);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
