import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Info } from 'lucide-react';

export default function CreateTask({ user }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    total_prize_pool: '',
    max_participants: '1',
    deadline: '',
    reward_url: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('/tasks', formData);
      const taskId = res.data.id;
      navigate(`/payment/${taskId}`);
    } catch (err) {
      setError(err.response?.data?.error || "Error creating task");
    } finally {
      setLoading(false);
    }
  };

  const rewardPerPerson = formData.total_prize_pool && formData.max_participants 
    ? Math.floor(parseInt(formData.total_prize_pool) / parseInt(formData.max_participants))
    : 0;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Create Prize Pool</h1>
          <p className="page-subtitle">Define your task and set the reward pool</p>
        </div>
      </div>

      <div className="auth-card" style={{ maxWidth: '600px', margin: '0' }}>
        {error && <div style={{ color: 'var(--danger-text)', marginBottom: '16px', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Task Title</label>
            <input name="title" value={formData.title} onChange={handleChange} placeholder="e.g., Join our Discord & Verify" required />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows="4" placeholder="Describe the task steps clearly..." required style={{ background: 'var(--item-bg)', border: '1px solid var(--border-color)', color: 'white', padding: '12px 20px', borderRadius: '12px', width: '100%', outline: 'none' }}></textarea>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label>Total Prize Pool (IDR/USD)</label>
              <input type="number" name="total_prize_pool" value={formData.total_prize_pool} onChange={handleChange} placeholder="Total amount" required />
            </div>
            <div className="form-group">
              <label>Max Participants</label>
              <input type="number" name="max_participants" value={formData.max_participants} onChange={handleChange} min="1" required />
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Info size={20} color="var(--primary)" />
            <span style={{ fontSize: '0.9rem' }}>Each participant will receive <strong>{rewardPerPerson}</strong> in rewards.</span>
          </div>

          <div className="form-group">
            <label>Reward URL (The link users get after approval)</label>
            <input type="url" name="reward_url" value={formData.reward_url} onChange={handleChange} placeholder="https://t.me/yourgroup or https://discord.gg/..." />
          </div>

          <div className="form-group">
            <label>Deadline (Optional)</label>
            <input type="date" name="deadline" value={formData.deadline} onChange={handleChange} />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', height: '48px' }}>
            {loading ? "Creating..." : "Next: Payment Proof"}
          </button>
        </form>
      </div>
    </div>
  );
}
