import { useState, useEffect } from 'react';
import axios from 'axios';
import { Check, X, Users, DollarSign } from 'lucide-react';

export default function AdminDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminTasks = async () => {
    try {
      const res = await axios.get('/admin/tasks');
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminTasks();
  }, []);

  const handleTaskAction = async (taskId, action) => {
    try {
      await axios.put(`/admin/tasks/${taskId}/${action}`);
      alert(`Task ${action}ed!`);
      fetchAdminTasks();
    } catch (err) {
      alert("Action failed: " + (err.response?.data?.error || "Unknown error"));
    }
  };

  if (loading) return <div className="container" style={{ textAlign: "center", marginTop: "100px" }}>Loading...</div>;

  const pendingTasks = tasks.filter(t => t.status === 'pending_approval');
  const otherTasks = tasks.filter(t => t.status !== 'pending_approval');

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Control Panel</h1>
          <p className="page-subtitle">Review pending tasks and verify deposits</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <section>
          <h2 style={{ marginBottom: '16px', fontSize: '1.2rem', color: 'var(--primary)' }}>Pending Approval ({pendingTasks.length})</h2>
          {pendingTasks.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No tasks awaiting approval.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {pendingTasks.map(task => (
                <div key={task.id} className="task-list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem' }}>{task.title}</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Posted by @{task.creator_username} • {new Date(task.created_at).toLocaleString()}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button className="btn-primary" onClick={() => handleTaskAction(task.id, 'approve')} style={{ background: '#10b981' }}><Check size={18} /> Approve</button>
                      <button className="btn-danger" onClick={() => handleTaskAction(task.id, 'reject')}><X size={18} /> Reject</button>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.1)', padding: '16px', borderRadius: '12px', width: '100%' }}>
                    <p style={{ fontSize: '0.9rem', marginBottom: '12px' }}>{task.description}</p>
                    <div style={{ display: 'flex', gap: '24px', fontSize: '0.9rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><DollarSign size={16} color="var(--active-bg)" /> <strong>Pool: {task.total_prize_pool}</strong></span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={16} /> <strong>Participants: {task.max_participants}</strong></span>
                    </div>
                  </div>

                  <div style={{ width: '100%' }}>
                    <p style={{ fontSize: '0.85rem', marginBottom: '8px', fontWeight: 'bold' }}>Deposit Proof:</p>
                    <a href={`http://localhost:5000${task.deposit_proof}`} target="_blank" rel="noreferrer">
                      <img src={`http://localhost:5000${task.deposit_proof}`} alt="Deposit Proof" style={{ maxHeight: '200px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 style={{ marginBottom: '16px', fontSize: '1.2rem', color: 'var(--text-muted)' }}>Active/Past Tasks</h2>
          <div style={{ opacity: 0.7 }}>
            {otherTasks.map(task => (
              <div key={task.id} className="task-list-item" style={{ marginBottom: '12px', padding: '12px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem' }}>{task.title} <span className={`badge ${task.status}`} style={{ marginLeft: '8px', fontSize: '0.7rem' }}>{task.status}</span></h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>By @{task.creator_username} • Prize Pool: {task.total_prize_pool}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
