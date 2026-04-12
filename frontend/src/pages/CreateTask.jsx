import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function CreateTask({ user, setCurrentUser }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rewardPoints, setRewardPoints] = useState(100);
  const [deadline, setDeadline] = useState('');
  const [rewardUrl, setRewardUrl] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rewardPoints > user.points) {
      setError("Insufficient points.");
      return;
    }

    try {
      const payload = { title, description, reward_points: parseInt(rewardPoints) };
      if (deadline) payload.deadline = deadline;
      if (rewardUrl) payload.reward_url = rewardUrl;

      await axios.post('/tasks', payload);
      if (setCurrentUser) {
        setCurrentUser({ ...user, points: user.points - parseInt(rewardPoints) });
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || "Error creating task");
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Post a New Task</h1>
          <p className="page-subtitle">Offer points to the community to get things done.</p>
        </div>
      </div>
      <div style={{ maxWidth: '600px', background: 'var(--item-bg)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
        
        {error && <div style={{ color: 'var(--danger-text)', marginBottom: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Task Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Design a logo" />
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="Provide clear instructions..." rows="4"></textarea>
          </div>
          
          <div className="form-group">
            <label>Reward Points (Your balance: {user.points} pts)</label>
            <input type="number" min="1" max={user.points} value={rewardPoints} onChange={(e) => setRewardPoints(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Deadline (Optional)</label>
            <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Reward URL (For QR Code - Optional)</label>
            <input type="url" placeholder="https://example.com/gift-card" value={rewardUrl} onChange={(e) => setRewardUrl(e.target.value)} />
          </div>
          
          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Post Task</button>
        </form>
      </div>
    </div>
  );
}
