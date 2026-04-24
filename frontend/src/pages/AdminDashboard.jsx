import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Check, X, Users, DollarSign, Landmark, Image as ImageIcon, ExternalLink, Calendar, Wallet } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export default function AdminDashboard() {
  const [tasks, setTasks] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [isApproving, setIsApproving] = useState(false);
  const fileInputRef = useRef(null);
  const socket = useSocket();

  const fetchAdminData = async () => {
    try {
      // Don't set loading to true for socket refreshes to avoid flicker
      const [tasksRes, withdrawalsRes] = await Promise.all([
        axios.get('/admin/tasks'),
        axios.get('/admin/withdrawals')
      ]);
      console.log('Admin Tasks:', tasksRes.data);
      setTasks(tasksRes.data);
      setWithdrawals(withdrawalsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('admin_task_update', fetchAdminData);
      socket.on('admin_withdrawal_update', fetchAdminData);
      socket.on('task_created', fetchAdminData);
      
      return () => {
        socket.off('admin_task_update');
        socket.off('admin_withdrawal_update');
        socket.off('task_created');
      };
    }
  }, [socket]);

  const handleTaskAction = async (taskId, action) => {
    try {
      await axios.put(`/admin/tasks/${taskId}/${action}`);
      alert(`Task ${action}ed!`);
      fetchAdminData();
    } catch (err) {
      alert("Action failed: " + (err.response?.data?.error || "Unknown error"));
    }
  };

  const handleWithdrawalReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject this withdrawal? The balance will be refunded to the user.')) return;
    try {
      await axios.post(`/admin/withdrawals/${id}/reject`);
      alert('Withdrawal rejected and refunded.');
      fetchAdminData();
    } catch (err) {
      alert("Action failed: " + (err.response?.data?.error || "Unknown error"));
    }
  };

  const handleWithdrawalApprove = async () => {
    if (!proofFile) {
      alert('Please upload a proof of transaction image.');
      return;
    }

    const formData = new FormData();
    formData.append('proof', proofFile);

    setIsApproving(true);
    try {
      await axios.post(`/admin/withdrawals/${selectedWithdrawal.id}/approve`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Withdrawal approved!');
      setSelectedWithdrawal(null);
      setProofFile(null);
      fetchAdminData();
    } catch (err) {
      alert("Action failed: " + (err.response?.data?.error || "Unknown error"));
    } finally {
      setIsApproving(false);
    }
  };

  if (loading) return <div className="container" style={{ textAlign: "center", marginTop: "100px" }}>Loading...</div>;

  const pendingTasks = tasks.filter(t => t.status === 'pending_approval');
  const otherTasks = tasks.filter(t => t.status !== 'pending_approval');

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
  const processedWithdrawals = withdrawals.filter(w => w.status !== 'pending');

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Control Panel</h1>
          <p className="page-subtitle">Manage platform operations and financial requests</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
        <button 
          onClick={() => setActiveTab('tasks')}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: activeTab === 'tasks' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '8px 16px',
            borderBottom: activeTab === 'tasks' ? '2px solid var(--primary)' : '2px solid transparent'
          }}
        >
          Task Management {pendingTasks.length > 0 && <span style={{ background: 'var(--danger-text)', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '0.7rem', marginLeft: '6px' }}>{pendingTasks.length}</span>}
        </button>
        <button 
          onClick={() => setActiveTab('withdrawals')}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: activeTab === 'withdrawals' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '8px 16px',
            borderBottom: activeTab === 'withdrawals' ? '2px solid var(--primary)' : '2px solid transparent'
          }}
        >
          Withdrawal Requests {pendingWithdrawals.length > 0 && <span style={{ background: 'var(--danger-text)', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '0.7rem', marginLeft: '6px' }}>{pendingWithdrawals.length}</span>}
        </button>
      </div>

      {activeTab === 'tasks' ? (
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
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <section>
            <h2 style={{ marginBottom: '16px', fontSize: '1.2rem', color: 'var(--primary)' }}>Pending Withdrawals ({pendingWithdrawals.length})</h2>
            {pendingWithdrawals.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No withdrawal requests pending.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {pendingWithdrawals.map(w => (
                  <div key={w.id} className="task-list-item" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(124, 58, 237, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                          <Wallet size={24} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>${w.amount}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>by @{w.username}</span>
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                            <Landmark size={14} /> Account: {w.bank_account}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="btn-primary" onClick={() => setSelectedWithdrawal(w)} style={{ background: '#10b981' }}><Check size={18} /> Approve</button>
                        <button className="btn-danger" onClick={() => handleWithdrawalReject(w.id)}><X size={18} /> Reject</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 style={{ marginBottom: '16px', fontSize: '1.2rem', color: 'var(--text-muted)' }}>Processed Withdrawals</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', opacity: 0.8 }}>
              {processedWithdrawals.map(w => (
                <div key={w.id} className="task-list-item" style={{ padding: '16px 24px', opacity: 0.8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600 }}>${w.amount}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>by @{w.username}</span>
                        <span className={`badge ${w.status}`} style={{ fontSize: '0.65rem' }}>{w.status}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Processed on {new Date(w.processed_at).toLocaleString()}
                      </div>
                    </div>
                    {w.proof_image && (
                      <a href={`http://localhost:5000${w.proof_image}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', textDecoration: 'none' }}>
                        <ImageIcon size={16} /> View Proof <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Approval Modal */}
      {selectedWithdrawal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0 }}>Approve Withdrawal</h3>
              <button onClick={() => { setSelectedWithdrawal(null); setProofFile(null); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>Withdrawal Details:</p>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px' }}>
                <div style={{ marginBottom: '8px' }}><strong>User:</strong> @{selectedWithdrawal.username}</div>
                <div style={{ marginBottom: '8px' }}><strong>Amount:</strong> ${selectedWithdrawal.amount}</div>
                <div><strong>Bank Account:</strong> {selectedWithdrawal.bank_account}</div>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>Upload Transfer Proof (Image)</label>
              <div 
                onClick={() => fileInputRef.current.click()}
                style={{ 
                  border: '2px dashed var(--border-color)', 
                  borderRadius: '12px', 
                  padding: '32px', 
                  textAlign: 'center', 
                  cursor: 'pointer',
                  background: proofFile ? 'rgba(16, 185, 129, 0.05)' : 'none',
                  borderColor: proofFile ? '#10b981' : 'var(--border-color)'
                }}
              >
                {proofFile ? (
                  <div style={{ color: '#10b981' }}>
                    <ImageIcon size={32} style={{ marginBottom: '8px' }} />
                    <div style={{ fontSize: '0.85rem' }}>{proofFile.name}</div>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)' }}>
                    <ImageIcon size={32} style={{ marginBottom: '8px' }} />
                    <div style={{ fontSize: '0.85rem' }}>Click to upload screenshot</div>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept="image/*"
                onChange={(e) => setProofFile(e.target.files[0])}
              />
            </div>

            <button 
              className="btn-primary" 
              style={{ width: '100%', justifyContent: 'center', background: '#10b981' }}
              onClick={handleWithdrawalApprove}
              disabled={isApproving || !proofFile}
            >
              {isApproving ? 'Processing...' : 'Complete Approval'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
