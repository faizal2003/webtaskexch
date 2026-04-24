const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const fs = require('fs');

if (!fs.existsSync('uploads/profiles')) {
    if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
    fs.mkdirSync('uploads/profiles');
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/profiles/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname))
    }
});
const upload = multer({ storage: storage });

router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const [existing] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const [result] = await db.query(
            'INSERT INTO users (username, password_hash) VALUES (?, ?)',
            [username, hash]
        );

        res.status(201).json({ id: result.insertId, username, message: 'User registered successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({ token, user: { id: user.id, username: user.username, role: user.role, profile_picture: user.profile_picture, balance: user.balance } });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/me', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const [users] = await db.query('SELECT id, username, role, profile_picture, balance FROM users WHERE id = ?', [decoded.id]);
        if (users.length === 0) return res.status(404).json({ error: 'User not found' });
        
        res.json(users[0]);
    } catch(err) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

router.put('/profile', authMiddleware, upload.single('profile_picture'), async (req, res) => {
    try {
        const { username, password } = req.body;
        const userId = req.user.id;

        const updates = [];
        const params = [];

        if (username) {
            // Check if username is already taken by another user
            const [existing] = await db.query('SELECT id FROM users WHERE username = ? AND id != ?', [username, userId]);
            if (existing.length > 0) {
                return res.status(400).json({ error: 'Username already taken' });
            }
            updates.push('username = ?');
            params.push(username);
        }

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            updates.push('password_hash = ?');
            params.push(hash);
        }

        if (req.file) {
            const profilePicPath = `/uploads/profiles/${req.file.filename}`;
            updates.push('profile_picture = ?');
            params.push(profilePicPath);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No updates provided' });
        }

        params.push(userId);
        await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

        const [updatedUser] = await db.query('SELECT id, username, role, profile_picture, balance FROM users WHERE id = ?', [userId]);
        res.json({ message: 'Profile updated successfully', user: updatedUser[0] });
    } catch (err) {
        console.error('Update Profile Error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Calculate total accumulation (sum of rewards from approved applications)
        const [stats] = await db.query(`
            SELECT SUM(FLOOR(t.total_prize_pool / t.max_participants)) as total_accumulation
            FROM applications a
            JOIN tasks t ON a.task_id = t.id
            WHERE a.worker_id = ? AND a.status = 'approved'
        `, [userId]);

        res.json({
            total_accumulation: stats[0].total_accumulation || 0
        });
    } catch (err) {
        console.error('Stats Error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/withdraw', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { amount, bank_account } = req.body;

        if (!amount || amount <= 0 || !bank_account) {
            return res.status(400).json({ error: 'Invalid amount or bank account' });
        }

        const [users] = await db.query('SELECT balance FROM users WHERE id = ?', [userId]);
        if (users[0].balance < amount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        // Deduct balance and create withdrawal request
        await db.query('UPDATE users SET balance = balance - ? WHERE id = ?', [amount, userId]);
        await db.query('INSERT INTO withdrawals (user_id, amount, bank_account, status) VALUES (?, ?, ?, "pending")', [userId, amount, bank_account]);
        
        const [updatedUser] = await db.query('SELECT id, username, role, profile_picture, balance FROM users WHERE id = ?', [userId]);
        res.json({ message: 'Withdrawal request submitted successfully and is pending admin approval', user: updatedUser[0] });
    } catch (err) {
        console.error('Withdrawal Error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/notifications', authMiddleware, async (req, res) => {
    try {
        const [notifications] = await db.query(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
            [req.user.id]
        );
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.put('/notifications/read', authMiddleware, async (req, res) => {
    try {
        await db.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [req.user.id]);
        res.json({ message: 'Notifications marked as read' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/withdrawals', authMiddleware, async (req, res) => {
    try {
        const [withdrawals] = await db.query(
            'SELECT * FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(withdrawals);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
