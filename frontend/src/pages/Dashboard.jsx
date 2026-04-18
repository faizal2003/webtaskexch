import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Trash2, Image, LayoutList, ClipboardCheck, Edit2, X, DollarSign, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

export default function Dashboard({ user }) {
  const [createdTasks, setCreatedTasks] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applicationsCache, setApplicationsCache] = useState({});
  const [proofFiles, setProofFiles] = useState({});
  
  // Edit Modal State
  const [editingTask, setEditingTask] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    reward_url: ''
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [res1, res2] = await Promise.all([
        axios.get('http://localhost:5000/api/tasks/my/created'),
        axios.get('http://localhost:5000/api/tasks/my/applications')
      ]);
      setCreatedTasks(res1.data);
      setMyApplications(res2.data);
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
      alert("Error loading data: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const loadApplicationsForTask = async (taskId) => {
    if (applicationsCache[taskId]) {
        const newCache = { ...applicationsCache };
        delete newCache[taskId];
        setApplicationsCache(newCache);
        return;
    }
    try {
      const res = await axios.get(`http://localhost:5000/api/tasks/${taskId}/applications`);
      setApplicationsCache(prev => ({ ...prev, [taskId]: res.data }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleReview = async (appId, action) => {
    try {
      await axios.post(`http://localhost:5000/api/tasks/review/${appId}`, { action });
      alert(`Submission ${action}d successfully`);
      fetchDashboardData();
      setApplicationsCache({}); 
    } catch (err) {
      alert(err.response?.data?.error || "Error reviewing submission");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/tasks/${taskId}`);
      alert("Task deleted");
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.error || "Error deleting task");
    }
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setEditFormData({
      title: task.title,
      description: task.description,
      deadline: task.deadline ? task.deadline.split('T')[0] : '',
      reward_url: task.reward_url || ''
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/tasks/${editingTask.id}`, editFormData);
      alert("Task updated");
      setEditingTask(null);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.error || "Error updating task");
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
      await axios.post(`http://localhost:5000/api/tasks/${taskId}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("Work submitted for review!");
      setProofFiles(prev => ({ ...prev, [taskId]: null }));
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.error || "Error submitting work");
    }
  };

  const renderDescription = (text) => {
    if (!text) return "";
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a key={i} href={part} target="_blank" rel="noreferrer" style={{ color: "var(--primary)", textDecoration: "underline" }}>
            {part}
          </a>
        );
      }
      return part;
    });
  };

  if (loading) return <div className="container" style={{ textAlign: "center", marginTop: "100px" }}>Loading Dashboard...</div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Management Dashboard</h1>
          <p className="page-subtitle">Track your prize pools and participation</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={fetchDashboardData} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '24px', border: '1px solid var(--border-color)', background: 'var(--item-bg)', color: 'white', cursor: 'pointer' }}>
            Refresh Data
          </button>
          <Link to="/create" className="btn-primary">Create New Pool</Link>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        
        {/* WORKER SECTION (PRIORITIZED) */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>Pools You Joined</h2>
            <span className="badge open" style={{ fontSize: '0.75rem', padding: '2px 10px' }}>{myApplications.length} ACTIVE</span>
          </div>

          {myApplications.length === 0 ? (
            <div style={{ background: 'var(--item-bg)', borderRadius: '16px', padding: '40px', textAlign: 'center', border: '1px dashed var(--border-color)' }}>
              <LayoutList size={40} color="var(--text-muted)" style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>You haven't joined any pools yet.</p>
              <button onClick={() => window.location.href = '/'} className="btn-primary">Explore Available Tasks</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {myApplications.map(app => (
                <div key={app.id} className="task-list-item" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div className="task-icon" style={{ background: 'rgba(255, 205, 107, 0.1)' }}><DollarSign size={20} color="var(--active-bg)" /></div>
                      <h4 style={{ fontSize: '1.1rem' }}>{app.title}</h4>
                    </div>
                    <span className={`badge ${app.status}`}>{app.status.toUpperCase()}</span>
                  </div>

                  <div style={{ paddingLeft: '64px', width: '100%' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '16px', whiteSpace: 'pre-wrap' }}>
                      {renderDescription(app.description)}
                    </div>
                    
                    <div className="task-meta" style={{ marginBottom: '20px' }}>
                        <span style={{ color: 'var(--active-bg)', fontWeight: '600', fontSize: '1rem' }}>Reward: {Math.floor(app.total_prize_pool / app.max_participants)} Credits</span>
                        <span style={{ color: 'var(--text-muted)' }}><Calendar size={14} /> Joined on {new Date(app.created_at).toLocaleDateString()}</span>
                    </div>

                    {app.status === 'pending' && (
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <p style={{ fontSize: '0.85rem', marginBottom: '12px', color: 'var(--text-main)', fontWeight: '500' }}>Submit Proof of Completion</p>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <input type="file" accept="image/*" onChange={(e) => handleFileChange(app.task_id, e)} style={{ fontSize: '0.8rem', width: 'auto', flex: 1 }} />
                          <button className="btn-primary" onClick={() => submitWork(app.task_id)} style={{ padding: '8px 20px', fontSize: '0.85rem' }}>Submit Work</button>
                        </div>
                      </div>
                    )}

                    {app.status === 'submitted' && (
                      <div style={{ background: 'rgba(245, 158, 11, 0.05)', padding: '16px', borderRadius: '12px', color: '#f59e0b', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ClipboardCheck size={18} /> Waiting for creator review...
                      </div>
                    )}

                    {app.status === 'approved' && (
                      <div style={{ marginTop: '16px', padding: '24px', background: 'white', borderRadius: '16px', width: 'max-content', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                        <h5 style={{ color: '#0B081A', marginBottom: '16px', fontSize: '1rem', fontWeight: '700' }}>Claim Your Reward</h5>
                        {app.reward_url ? (
                          <>
                           <div style={{ marginBottom: '16px', padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
                             <QRCodeSVG value={app.reward_url} size={140} />
                           </div>
                           <a href={app.reward_url} target="_blank" rel="noreferrer" style={{ display: 'block', color: 'white', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600', padding: '10px 20px', background: 'var(--primary)', borderRadius: '8px' }}>
                             Open Reward Link
                           </a>
                          </>
                        ) : (
                           <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No link provided by creator.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* CREATOR SECTION */}
        <section>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', color: 'var(--text-muted)' }}>Prize Pools You Created</h2>
          
          {createdTasks.length === 0 ? (
            <div style={{ background: 'var(--item-bg)', borderRadius: '16px', padding: '24px', textAlign: 'center', border: '1px dashed var(--border-color)' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.9rem' }}>You haven't created any prize pools yet.</p>
              <button onClick={() => window.location.href = '/create'} className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>Create Your First Pool</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {createdTasks.map(task => (
                <div key={task.id} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="task-list-item">
                    <div className="task-info">
                      <div className="task-icon"><LayoutList size={20} color="var(--primary)" /></div>
                      <div className="task-details">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h4 style={{ margin: 0 }}>{task.title}</h4>
                          <span className={`badge ${task.status}`}>{task.status.replace('_', ' ')}</span>
                        </div>
                        <div className="task-meta">
                          <span style={{ color: 'var(--text-muted)' }}><Calendar size={14} /> {new Date(task.created_at).toLocaleDateString()}</span>
                          <span style={{ color: 'var(--active-bg)', fontWeight: '600' }}>Pool: {task.total_prize_pool}</span>
                          <span style={{ color: 'var(--text-muted)' }}><Users size={14} /> Max: {task.max_participants}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {task.status === 'awaiting_payment' && (
                        <Link to={`/payment/${task.id}`} className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.75rem', background: '#f59e0b' }}>Pay Now</Link>
                      )}
                      <button className="icon-btn" title="View Participants" onClick={() => loadApplicationsForTask(task.id)} style={{ color: applicationsCache[task.id] ? 'var(--primary)' : 'var(--text-muted)' }}>
                        <Users size={16} />
                      </button>
                      <button className="icon-btn" title="Edit" onClick={() => openEditModal(task)}><Edit2 size={16}/></button>
                      <button className="icon-btn" title="Delete" onClick={() => handleDeleteTask(task.id)} style={{ color: 'var(--danger-text)' }}><Trash2 size={16}/></button>
                    </div>
                  </div>
                  
                  {applicationsCache[task.id] && (
                    <div className="fade-in" style={{ padding: '20px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '0 0 16px 16px', marginTop: '-8px', marginBottom: '16px', borderTop: 'none' }}>
                      <h5 style={{ marginBottom: '12px', fontSize: '0.9rem', color: 'var(--primary)' }}>Application Pipeline</h5>
                      {applicationsCache[task.id].length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No participants yet.</p>}
                      <ul style={{ listStyle: 'none' }}>
                        {applicationsCache[task.id].map(app => (
                          <li key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>@{app.worker_username}</span>
                              <span className={`badge ${app.status}`} style={{ fontSize: '0.7rem' }}>{app.status}</span>
                            </div>
                            {app.status === 'submitted' && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {app.proof_image && (
                                  <a href={`http://localhost:5000${app.proof_image}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--active-bg)', textDecoration: 'none', fontSize: '0.8rem' }}>
                                    <Image size={14}/> View Proof
                                  </a>
                                )}
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button className="btn-primary" style={{ padding: '4px 12px', fontSize: '0.75rem', background: '#10b981' }} onClick={() => handleReview(app.id, 'approve')}>Approve</button>
                                  <button className="btn-danger" style={{ padding: '4px 12px', fontSize: '0.75rem' }} onClick={() => handleReview(app.id, 'reject')}>Reject</button>
                                </div>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Edit Modal */}
      {editingTask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="auth-card fade-in" style={{ maxWidth: '500px', position: 'relative' }}>
            <button onClick={() => setEditingTask(null)} style={{ position: 'absolute', right: '20px', top: '20px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={24} />
            </button>
            <h2 style={{ textAlign: 'left', fontSize: '1.5rem', marginBottom: '24px' }}>Edit Pool</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Pool Title</label>
                <input type="text" value={editFormData.title} onChange={e => setEditFormData({...editFormData, title: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows="4" value={editFormData.description} onChange={e => setEditFormData({...editFormData, description: e.target.value})} required style={{ background: 'var(--item-bg)', border: '1px solid var(--border-color)', color: 'white', padding: '12px 20px', borderRadius: '12px', width: '100%', outline: 'none' }}></textarea>
              </div>
              <div className="form-group">
                <label>Reward URL</label>
                <input type="url" value={editFormData.reward_url} onChange={e => setEditFormData({...editFormData, reward_url: e.target.value})} />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>Save Changes</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
