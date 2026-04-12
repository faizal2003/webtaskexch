import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Trash2, Image, LayoutList, ClipboardCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

export default function Dashboard({ user }) {
  const [createdTasks, setCreatedTasks] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [applicationsCache, setApplicationsCache] = useState({});
  const [proofFiles, setProofFiles] = useState({});

  const fetchDashboardData = async () => {
    try {
      const [res1, res2] = await Promise.all([
        axios.get('/tasks/my/created'),
        axios.get('/tasks/my/applications')
      ]);
      setCreatedTasks(res1.data);
      setMyApplications(res2.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const loadApplicationsForTask = async (taskId) => {
    if (applicationsCache[taskId]) return; // toggle off could be added, but just loading for now
    try {
      const res = await axios.get(`/tasks/${taskId}/applications`);
      setApplicationsCache(prev => ({ ...prev, [taskId]: res.data }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleReview = async (appId, action) => {
    try {
      await axios.post(`/tasks/review/${appId}`, { action });
      alert(`Submission ${action}d successfully`);
      fetchDashboardData();
      setApplicationsCache({}); // Clear cache to force reload next time
    } catch (err) {
      alert(err.response?.data?.error || "Error reviewing submission");
    }
  };

  const handleFileChange = (taskId, e) => {
    setProofFiles(prev => ({ ...prev, [taskId]: e.target.files[0] }));
  };

  const submitWork = async (taskId) => {
    const file = proofFiles[taskId];
    if (!file) {
      alert("Please select a proof image first.");
      return;
    }

    const formData = new FormData();
    formData.append('proof', file);

    try {
      await axios.post(`/tasks/${taskId}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("Work submitted successfully!");
      setProofFiles(prev => ({ ...prev, [taskId]: null }));
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.error || "Error submitting work");
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Task</h1>
          <p className="page-subtitle">Set the goals to grow your company</p>
        </div>
        <Link to="/create" className="btn-primary">Add New Task</Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {/* Creator Section */}
        <div>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', color: 'var(--text-muted)' }}>Tasks You Posted</h2>
          
          {createdTasks.length === 0 ? (
            <div className="empty-card">
              <div style={{ background: 'var(--active-bg)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <ClipboardCheck size={28} color="var(--active-text) "/>
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>Oops! No Task</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '0.9rem' }}>You need to create some tasks for your employees to work on</p>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                <button className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>Import</button>
                <Link to="/create" className="btn-primary">Add New</Link>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {createdTasks.map(task => (
                <div key={task.id} style={{ display: 'flex', flexDirection: 'column', marginBottom: '16px' }}>
                  <div className="task-list-item">
                    <div className="task-info">
                      <div className="task-icon">
                        <LayoutList size={24} color="var(--primary)" />
                      </div>
                      <div className="task-details">
                        <h4>{task.title}</h4>
                        <div className="task-meta">
                          <span style={{ color: 'var(--text-muted)' }}><Calendar size={14} /> Created: {new Date(task.created_at).toLocaleDateString()}</span>
                          {task.deadline && <span style={{ color: 'var(--text-muted)' }}>Deadline: {new Date(task.deadline).toLocaleDateString()}</span>}
                          <span style={{ color: 'var(--active-bg)' }}>{task.reward_points} Pts</span>
                          <span className={`badge ${task.status}`}>{task.status.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button className="btn-primary" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} onClick={() => loadApplicationsForTask(task.id)}>
                        View Apps
                      </button>
                      <button className="btn-danger"><Trash2 size={16}/> Delete</button>
                    </div>
                  </div>
                  
                  {applicationsCache[task.id] && (
                    <div style={{ padding: '24px', background: 'var(--item-bg)', border: '1px solid var(--primary)', borderRadius: '16px', marginTop: '-8px', marginBottom: '16px', opacity: 0.9 }}>
                      <h5 style={{ marginBottom: '16px', fontSize: '1rem', color: 'var(--primary)' }}>Application Pipeline</h5>
                      {applicationsCache[task.id].length === 0 && <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No applications yet.</p>}
                      <ul style={{ listStyle: 'none' }}>
                        {applicationsCache[task.id].map(app => (
                          <li key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <span style={{ fontWeight: 500 }}>@{app.worker_username}</span>
                              <span className={`badge ${app.status}`}>{app.status}</span>
                            </div>
                            {app.status === 'submitted' && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                {app.proof_image && (
                                  <a href={`http://localhost:5000${app.proof_image}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--active-bg)', textDecoration: 'none', fontSize: '0.9rem' }}>
                                    <Image size={16}/> View Proof
                                  </a>
                                )}
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button className="btn-primary" onClick={() => handleReview(app.id, 'approve')}>Approve</button>
                                  <button className="btn-danger" onClick={() => handleReview(app.id, 'reject')}>Reject</button>
                                </div>
                              </div>
                            )}
                            {app.status === 'pending' && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Working on it...</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Worker Section */}
        <div>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', color: 'var(--text-muted)' }}>Tasks You're Working On</h2>
          {myApplications.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>You haven't applied to any tasks yet. Check the Overview page!</p>}
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {myApplications.map(app => (
              <div key={app.id} className="task-list-item" style={{ alignItems: 'flex-start' }}>
                <div className="task-info">
                  <div className="task-icon"><LayoutList size={24} color="var(--active-bg)" /></div>
                  <div className="task-details" style={{ flex: 1 }}>
                    <h4>{app.title}</h4>
                    <div className="task-meta" style={{ marginBottom: '16px' }}>
                      <span style={{ color: 'var(--active-bg)' }}>{app.reward_points} Pts</span>
                      <span className={`badge ${app.status}`}>{app.status}</span>
                    </div>
                    
                    {(app.status === 'pending' || app.status === 'accepted') && (
                      <div style={{ marginTop: '12px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px' }}>
                        <p style={{ fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-muted)' }}>Upload Proof of Completion</p>
                        <input type="file" accept="image/*" onChange={(e) => handleFileChange(app.task_id, e)} style={{ marginBottom: '12px', background: 'var(--sidebar-bg)' }} />
                        <button className="btn-primary" onClick={() => submitWork(app.task_id)}>
                          Submit Work for Review
                        </button>
                      </div>
                    )}
                    {app.status === 'submitted' && <p style={{ fontSize: '0.9rem', color: '#f59e0b' }}>Awaiting review from creator...</p>}
                    {app.status === 'approved' && (
                      <div style={{ marginTop: '16px', padding: '16px', background: 'white', borderRadius: '12px', width: 'max-content' }}>
                        <h5 style={{ color: '#000', marginBottom: '12px', fontSize: '0.9rem' }}>Scan to Claim Reward</h5>
                        {app.reward_url ? (
                           <QRCodeSVG value={app.reward_url} size={128} />
                        ) : (
                           <p style={{ color: '#666', fontSize: '0.85rem' }}>No reward URL was provided by the creator.</p>
                        )}
                        <p style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '12px', fontWeight: 'bold' }}>Completed on {new Date(app.completed_at).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
