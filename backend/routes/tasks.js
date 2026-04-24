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

// Get all public tasks (open)
router.get('/', async (req, res) => {
    try {
        const [tasks] = await db.query(`
            SELECT t.*, u.username as creator_username,
            (SELECT COUNT(*) FROM applications WHERE task_id = t.id AND status != 'rejected') as participant_count
            FROM tasks t
            JOIN users u ON t.creator_id = u.id
            WHERE t.status = 'open'
            ORDER BY t.created_at DESC
        `);
        res.json(tasks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create a new task
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, description, total_prize_pool, max_participants, deadline, reward_url } = req.body;
        const creatorId = req.user.id;

        if (!title || !description || !total_prize_pool || !max_participants) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const pool = parseInt(total_prize_pool);
        const participants = parseInt(max_participants);

        if (pool <= 0 || participants <= 0) {
            return res.status(400).json({ error: 'Invalid pool or participants' });
        }

        const [result] = await db.query(
            'INSERT INTO tasks (title, description, total_prize_pool, max_participants, creator_id, deadline, reward_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, "awaiting_payment")',
            [title, description, pool, participants, creatorId, deadline || null, reward_url || null]
        );

        res.status(201).json({ id: result.insertId, message: 'Task created' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Upload payment proof
router.post('/:id/payment', authMiddleware, upload.single('deposit_proof'), async (req, res) => {
    try {
        const taskId = req.params.id;
        const creatorId = req.user.id;
        const depositProof = req.file ? `/uploads/${req.file.filename}` : null;
        if (!depositProof) return res.status(400).json({ error: 'Proof image required' });

        const [result] = await db.query(
            "UPDATE tasks SET deposit_proof = ?, status = 'pending_approval' WHERE id = ? AND creator_id = ? AND status = 'awaiting_payment'",
            [depositProof, taskId, creatorId]
        );
        if (result.affectedRows === 0) return res.status(400).json({ error: 'Task not found or already paid' });
        res.json({ message: 'Payment proof submitted' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Apply/Join a task
router.post('/:id/apply', authMiddleware, async (req, res) => {
    try {
        const taskId = req.params.id;
        const workerId = req.user.id;
        
        const [tasks] = await db.query('SELECT creator_id, max_participants, status FROM tasks WHERE id = ?', [taskId]);
        if (tasks.length === 0) return res.status(404).json({ error: 'Task not found' });
        if (tasks[0].status !== 'open') return res.status(400).json({ error: 'Task is not open' });
        if (tasks[0].creator_id === workerId) return res.status(400).json({ error: 'Cannot join own task' });

        // Check if task is full based on non-rejected applications
        const [active] = await db.query('SELECT COUNT(*) as count FROM applications WHERE task_id = ? AND status != "rejected"', [taskId]);
        if (active[0].count >= tasks[0].max_participants) {
            return res.status(400).json({ error: 'Task pool is already full' });
        }

        const [existing] = await db.query('SELECT id FROM applications WHERE task_id = ? AND worker_id = ?', [taskId, workerId]);
        if (existing.length > 0) return res.status(400).json({ error: 'Already joined' });

        await db.query('INSERT INTO applications (task_id, worker_id, status) VALUES (?, ?, "pending")', [taskId, workerId]);
        res.json({ message: 'Joined successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get my applications
router.get('/my/applications', authMiddleware, async (req, res) => {
    try {
        const [apps] = await db.query(`
            SELECT 
                a.id, a.task_id, a.status, a.created_at, a.proof_image, a.completed_at,
                t.title, t.total_prize_pool, t.max_participants, t.reward_url, t.description
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

// Get applications for a task (Creator view)
router.get('/:id/applications', authMiddleware, async (req, res) => {
    try {
        const [apps] = await db.query(`
            SELECT a.*, u.username as worker_username 
            FROM applications a 
            JOIN users u ON a.worker_id = u.id 
            WHERE a.task_id = ?
        `, [req.params.id]);
        res.json(apps);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Review submission
router.post('/review/:appId', authMiddleware, async (req, res) => {
    try {
        const appId = req.params.appId;
        const { action } = req.body;
        const creatorId = req.user.id;

        const [apps] = await db.query(`
            SELECT a.*, t.creator_id, t.total_prize_pool, t.max_participants, t.id as task_id
            FROM applications a
            JOIN tasks t ON a.task_id = t.id
            WHERE a.id = ?
        `, [appId]);

        if (apps.length === 0 || apps[0].creator_id !== creatorId) return res.status(403).json({ error: 'Unauthorized' });

        if (action === 'approve') {
            await db.query("UPDATE applications SET status = 'approved', completed_at = CURRENT_TIMESTAMP WHERE id = ?", [appId]);
            
            // Calculate reward and credit user balance
            const reward = Math.floor(apps[0].total_prize_pool / apps[0].max_participants);
            await db.query("UPDATE users SET balance = balance + ? WHERE id = ?", [reward, apps[0].worker_id]);

            const [approved] = await db.query('SELECT COUNT(*) as count FROM applications WHERE task_id = ? AND status = "approved"', [apps[0].task_id]);
            if (approved[0].count >= apps[0].max_participants) {
                await db.query('UPDATE tasks SET status = "completed" WHERE id = ?', [apps[0].task_id]);
            }
            res.json({ message: 'Approved' });
        } else {
            await db.query("UPDATE applications SET status = 'rejected' WHERE id = ?", [appId]);
            res.json({ message: 'Rejected' });
        }
    } catch(err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete task
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const [tasks] = await db.query('SELECT creator_id FROM tasks WHERE id = ?', [req.params.id]);
        if (tasks.length === 0) return res.status(404).json({ error: 'Not found' });
        if (tasks[0].creator_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });
        await db.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get my created tasks
router.get('/my/created', authMiddleware, async (req, res) => {
    try {
        const [tasks] = await db.query('SELECT * FROM tasks WHERE creator_id = ? ORDER BY created_at DESC', [req.user.id]);
        res.json(tasks);
    } catch(err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Submit work proof
router.post('/:id/submit', authMiddleware, upload.single('proof'), async (req, res) => {
    try {
        const proofImage = req.file ? `/uploads/${req.file.filename}` : null;
        if (!proofImage) return res.status(400).json({ error: 'Proof image required' });
        await db.query(
            "UPDATE applications SET status = 'submitted', proof_image = ? WHERE task_id = ? AND worker_id = ? AND status = 'pending'",
            [proofImage, req.params.id, req.user.id]
        );
        res.json({ message: 'Submitted' });
    } catch(err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
