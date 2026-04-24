const express = require('express');
const db = require('../db');
const adminMiddleware = require('../middleware/adminMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

if (!fs.existsSync('uploads/withdrawals')) {
    if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
    fs.mkdirSync('uploads/withdrawals');
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/withdrawals/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'proof-' + uniqueSuffix + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });

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

// Get all withdrawals
router.get('/withdrawals', adminMiddleware, async (req, res) => {
    try {
        const [withdrawals] = await db.query(`
            SELECT w.*, u.username 
            FROM withdrawals w
            JOIN users u ON w.user_id = u.id
            ORDER BY w.created_at DESC
        `);
        res.json(withdrawals);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Approve withdrawal with proof image
router.post('/withdrawals/:id/approve', adminMiddleware, upload.single('proof'), async (req, res) => {
    try {
        const proofImage = req.file ? `/uploads/withdrawals/${req.file.filename}` : null;
        if (!proofImage) return res.status(400).json({ error: 'Proof image required' });

        await db.query(
            "UPDATE withdrawals SET status = 'approved', proof_image = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?",
            [proofImage, req.params.id]
        );

        // Add notification for user
        const [withdrawalInfo] = await db.query('SELECT user_id, amount FROM withdrawals WHERE id = ?', [req.params.id]);
        if (withdrawalInfo.length > 0) {
            await db.query(
                'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
                [withdrawalInfo[0].user_id, `Your withdrawal request of $${withdrawalInfo[0].amount} has been approved.`]
            );
        }

        res.json({ message: 'Withdrawal approved' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Reject withdrawal and refund user balance
router.post('/withdrawals/:id/reject', adminMiddleware, async (req, res) => {
    try {
        const [withdrawal] = await db.query('SELECT user_id, amount, status FROM withdrawals WHERE id = ?', [req.params.id]);
        if (withdrawal.length === 0) return res.status(404).json({ error: 'Withdrawal not found' });
        if (withdrawal[0].status !== 'pending') return res.status(400).json({ error: 'Already processed' });

        // Refund balance
        await db.query('UPDATE users SET balance = balance + ? WHERE id = ?', [withdrawal[0].amount, withdrawal[0].user_id]);
        
        await db.query(
            "UPDATE withdrawals SET status = 'rejected', processed_at = CURRENT_TIMESTAMP WHERE id = ?",
            [req.params.id]
        );

        // Add notification for user
        await db.query(
            'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
            [withdrawal[0].user_id, `Your withdrawal request of $${withdrawal[0].amount} has been rejected and refunded.`]
        );

        res.json({ message: 'Withdrawal rejected and balance refunded' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
