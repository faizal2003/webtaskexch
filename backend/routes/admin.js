const express = require('express');
const db = require('../db');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

// Get all tasks for admin (including pending)
router.get('/tasks', adminMiddleware, async (req, res) => {
    try {
        const [tasks] = await db.query(`
            SELECT t.*, u.username as creator_username 
            FROM tasks t
            JOIN users u ON t.creator_id = u.id
            ORDER BY t.created_at DESC
        `);
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Approve a task
router.put('/tasks/:id/approve', adminMiddleware, async (req, res) => {
    try {
        await db.query("UPDATE tasks SET status = 'open' WHERE id = ?", [req.params.id]);
        res.json({ message: 'Task approved and published' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Reject a task
router.put('/tasks/:id/reject', adminMiddleware, async (req, res) => {
    try {
        await db.query("UPDATE tasks SET status = 'rejected' WHERE id = ?", [req.params.id]);
        res.json({ message: 'Task rejected' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
