const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });

const router = express.Router();

// Get all tasks (with creator username)
router.get('/', async (req, res) => {
    try {
        const [tasks] = await db.query(`
            SELECT t.*, u.username as creator_username
            FROM tasks t
            JOIN users u ON t.creator_id = u.id
            ORDER BY t.created_at DESC
        `);
        res.json(tasks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create a new task (deducts points)
router.post('/', authMiddleware, async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { title, description, reward_points, deadline, reward_url } = req.body;
        const creatorId = req.user.id;

        if (!title || !description || reward_points <= 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'Invalid task data' });
        }

        // Check if user has enough points
        const [users] = await connection.query('SELECT points FROM users WHERE id = ? FOR UPDATE', [creatorId]);
        const userPoints = users[0].points;
        
        if (userPoints < reward_points) {
            await connection.rollback();
            return res.status(400).json({ error: 'Insufficient points' });
        }

        // Deduct points from creator temporarily (held in escrow basically)
        await connection.query('UPDATE users SET points = points - ? WHERE id = ?', [reward_points, creatorId]);

        // Insert task
        const [result] = await connection.query(
            'INSERT INTO tasks (title, description, reward_points, creator_id, deadline, reward_url) VALUES (?, ?, ?, ?, ?, ?)',
            [title, description, reward_points, creatorId, deadline || null, reward_url || null]
        );

        await connection.commit();
        res.status(201).json({ id: result.insertId, title, reward_points, message: 'Task created successfully' });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        connection.release();
    }
});

// Get tasks created by me
router.get('/my/created', authMiddleware, async (req, res) => {
    try {
        const [tasks] = await db.query('SELECT * FROM tasks WHERE creator_id = ? ORDER BY created_at DESC', [req.user.id]);
        res.json(tasks);
    } catch(err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get tasks I applied for
router.get('/my/applications', authMiddleware, async (req, res) => {
    try {
        const [apps] = await db.query(`
            SELECT a.*, t.title, t.description, t.reward_points, t.deadline, t.reward_url 
            FROM applications a
            JOIN tasks t ON a.task_id = t.id
            WHERE a.worker_id = ?
            ORDER BY a.created_at DESC
        `, [req.user.id]);
        res.json(apps);
    } catch(err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Apply for a task
router.post('/:id/apply', authMiddleware, async (req, res) => {
    try {
        const taskId = req.params.id;
        const workerId = req.user.id;
        
        const [tasks] = await db.query('SELECT creator_id FROM tasks WHERE id = ?', [taskId]);
        if (tasks.length === 0) return res.status(404).json({ error: 'Task not found' });
        if (tasks[0].creator_id === workerId) return res.status(400).json({ error: 'Cannot apply to own task' });

        const [existing] = await db.query('SELECT id FROM applications WHERE task_id = ? AND worker_id = ?', [taskId, workerId]);
        if (existing.length > 0) return res.status(400).json({ error: 'Already applied' });

        await db.query('INSERT INTO applications (task_id, worker_id) VALUES (?, ?)', [taskId, workerId]);
        res.json({ message: 'Applied successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Submit a task for review
router.post('/:id/submit', authMiddleware, upload.single('proof'), async (req, res) => {
    try {
        const taskId = req.params.id;
        const workerId = req.user.id;
        const proofImage = req.file ? `/uploads/${req.file.filename}` : null;

        if (!proofImage) {
            return res.status(400).json({ error: 'Proof image is required' });
        }

        const [result] = await db.query(
            "UPDATE applications SET status = 'submitted', proof_image = ? WHERE task_id = ? AND worker_id = ? AND status IN ('pending', 'accepted')",
            [proofImage, taskId, workerId]
        );
        
        if (result.affectedRows === 0) return res.status(400).json({ error: 'Application not found or not in correct state' });

        res.json({ message: 'Task submitted for review' });
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get applications for a task (for creator)
router.get('/:id/applications', authMiddleware, async (req, res) => {
    try {
        const taskId = req.params.id;
        const creatorId = req.user.id;

        const [tasks] = await db.query('SELECT id FROM tasks WHERE id = ? AND creator_id = ?', [taskId, creatorId]);
        if (tasks.length === 0) return res.status(403).json({ error: 'Not authorized or task not found' });

        const [apps] = await db.query(`
            SELECT a.*, u.username as worker_username 
            FROM applications a 
            JOIN users u ON a.worker_id = u.id 
            WHERE a.task_id = ?
        `, [taskId]);
        res.json(apps);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Review a submission (approve/reject)
router.post('/review/:appId', authMiddleware, async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const appId = req.params.appId;
        const { action } = req.body; // 'approve' or 'reject'
        const creatorId = req.user.id;

        // Get application and task details
        const [apps] = await connection.query(`
            SELECT a.status as app_status, a.worker_id, t.creator_id, t.reward_points, t.id as task_id
            FROM applications a
            JOIN tasks t ON a.task_id = t.id
            WHERE a.id = ? FOR UPDATE
        `, [appId]);

        if (apps.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Application not found' });
        }

        const appDetails = apps[0];
        if (appDetails.creator_id !== creatorId) {
            await connection.rollback();
            return res.status(403).json({ error: 'Not authorized' });
        }
        if (appDetails.app_status !== 'submitted') {
            await connection.rollback();
            return res.status(400).json({ error: 'Application is not in submitted state' });
        }

        if (action === 'approve') {
            // Update application status and set completed_at timestamp
            await connection.query("UPDATE applications SET status = 'approved', completed_at = CURRENT_TIMESTAMP WHERE id = ?", [appId]);
            // Update task status
            await connection.query("UPDATE tasks SET status = 'completed' WHERE id = ?", [appDetails.task_id]);
            // Transfer points to worker
            await connection.query("UPDATE users SET points = points + ? WHERE id = ?", [appDetails.reward_points, appDetails.worker_id]);
            await connection.commit();
            res.json({ message: 'Submission approved, points transferred' });
        } else if (action === 'reject') {
            // Revert application status
            await connection.query("UPDATE applications SET status = 'rejected' WHERE id = ?", [appId]);
            // Do not refund points here for simplicity, or we could refund.
            await connection.commit();
            res.json({ message: 'Submission rejected' });
        } else {
            await connection.rollback();
            res.status(400).json({ error: 'Invalid action' });
        }
    } catch(err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        connection.release();
    }
});

// Update an application status (creator can 'accept' applications)
router.post('/application/:appId/accept', authMiddleware, async (req, res) => {
    try {
        const appId = req.params.appId;
        const creatorId = req.user.id;

        const [apps] = await db.query(`
            SELECT a.status as app_status, a.worker_id, t.creator_id, t.id as task_id
            FROM applications a
            JOIN tasks t ON a.task_id = t.id
            WHERE a.id = ?
        `, [appId]);

        if (apps.length === 0) return res.status(404).json({ error: 'Application not found' });
        const appDetails = apps[0];
        
        if (appDetails.creator_id !== creatorId) return res.status(403).json({ error: 'Not authorized' });

        await db.query("UPDATE applications SET status = 'accepted' WHERE id = ?", [appId]);
        res.json({ message: 'Application accepted' });
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
