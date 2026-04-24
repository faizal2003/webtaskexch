import { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { User, Lock, Save, AlertCircle, Camera, Wallet, TrendingUp, ArrowUpRight, Landmark, RefreshCw, Clock, CheckCircle, XCircle, FileText } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export default function Profile({ user, setUser }) {
  const [username, setUsername] = useState(user.username);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(user.profile_picture ? `http://localhost:5000${user.profile_picture}` : null);
  const [stats, setStats] = useState({ total_accumulation: 0 });
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = useRef(null);
  const socket = useSocket();

  const fetchData = useCallback(async (showLoading = false) => {
    if (showLoading) setIsSyncing(true);
    try {
      const [statsRes, userRes, historyRes] = await Promise.all([
        axios.get('/auth/stats'),
        axios.get('/auth/me'),
        axios.get('/auth/withdrawals')
      ]);
      setStats(statsRes.data);
      setUser(userRes.data);
      setWithdrawalHistory(historyRes.data);
    } catch (err) {
      console.error('Failed to sync data');
    } finally {
      if (showLoading) setIsSyncing(false);
    }
  }, [setUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (socket) {
      socket.on('balance_update', () => fetchData(false));
      socket.on('notification', () => fetchData(false));
      return () => {
        socket.off('balance_update');
        socket.off('notification');
      };
    }
  }, [socket, fetchData]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (password && password !== confirmPassword) {
      return setMessage({ type: 'error', text: 'Passwords do not match' });
    }

    setLoading(true);
    const formData = new FormData();
    if (username !== user.username) formData.append('username', username);
    if (password) formData.append('password', password);
    if (fileInputRef.current.files[0]) {
      formData.append('profile_picture', fileInputRef.current.files[0]);
    }

    try {
      const res = await axios.put('/auth/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setMessage({ type: 'success', text: res.data.message });
      if (res.data.user) {
        setUser(res.data.user);
      }
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.error || 'Failed to update profile' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0 || !bankAccount) return;
    
    setLoading(true);
    try {
      const res = await axios.post('/auth/withdraw', { 
        amount: parseFloat(withdrawAmount),
        bank_account: bankAccount
      });
      setMessage({ type: 'success', text: res.data.message });
      setWithdrawAmount('');
      setBankAccount('');
      await fetchData();
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.error || 'Withdrawal request failed' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container fade-in" style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Profile & Earnings</h1>
          <p className="page-subtitle">Manage your account and financial history</p>
        </div>
        <button 
          onClick={() => fetchData(true)} 
          className="icon-btn" 
          title="Sync Balance"
          disabled={isSyncing}
          style={{ background: 'var(--item-bg)', border: '1px solid var(--border-color)' }}
        >
          <RefreshCw size={18} className={isSyncing ? 'spin' : ''} />
        </button>
      </div>

      {message.text && (
        <div style={{ 
          padding: '16px', 
          borderRadius: '12px', 
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
          color: message.type === 'error' ? 'var(--danger-text)' : '#22c55e',
          border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`
        }}>
          {message.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(124, 58, 237, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <Wallet size={28} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Current Balance</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>${user.balance || 0}</div>
          </div>
        </div>
        
        <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}>
            <TrendingUp size={28} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Total Earned</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>${stats.total_accumulation || 0}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div className="card" style={{ padding: '32px' }}>
            <h3 style={{ marginBottom: '24px', fontSize: '1.1rem' }}>Withdraw Credits</h3>
            <form onSubmit={handleWithdraw}>
              <div className="form-group">
                <label>Amount to Withdraw ($)</label>
                <input 
                  type="number" 
                  value={withdrawAmount} 
                  onChange={e => setWithdrawAmount(e.target.value)} 
                  placeholder="0.00"
                  max={user.balance}
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label><Landmark size={14} /> Bank Account Number</label>
                <input 
                  type="text" 
                  value={bankAccount} 
                  onChange={e => setBankAccount(e.target.value)} 
                  placeholder="Enter account number"
                  required
                />
              </div>
              <button 
                type="submit" 
                className="btn-primary" 
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={loading || !withdrawAmount || parseFloat(withdrawAmount) > user.balance || !bankAccount}
              >
                <ArrowUpRight size={18} /> Request Payout
              </button>
            </form>
          </div>

          <div className="card" style={{ padding: '32px' }}>
            <h3 style={{ marginBottom: '24px', fontSize: '1.1rem' }}>Account Settings</h3>
            <form onSubmit={handleUpdate}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
                <div 
                  style={{ 
                    width: '90px', 
                    height: '90px', 
                    borderRadius: '50%', 
                    background: 'var(--item-bg)', 
                    border: '2px solid var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer'
                  }}
                  onClick={() => fileInputRef.current.click()}
                >
                  {preview ? (
                    <img src={preview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <User size={40} color="var(--text-muted)" />
                  )}
                  <div style={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    left: 0, 
                    right: 0, 
                    background: 'rgba(0,0,0,0.5)', 
                    padding: '4px', 
                    display: 'flex', 
                    justifyContent: 'center' 
                  }}>
                    <Camera size={12} color="white" />
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>

              <div className="form-group">
                <label><User size={14} /> Username</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} required />
              </div>

              <div className="form-group">
                <label><Lock size={14} /> New Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Settings'}
              </button>
            </form>
          </div>
        </div>

        <div className="card" style={{ padding: '32px' }}>
          <h3 style={{ marginBottom: '24px', fontSize: '1.1rem' }}>Withdrawal History</h3>
          {withdrawalHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <Clock size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
              <p>No withdrawal requests found.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {withdrawalHistory.map(w => (
                <div key={w.id} style={{ 
                  padding: '20px', 
                  borderRadius: '16px', 
                  background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>${w.amount}</span>
                      <span className={`badge ${w.status}`} style={{ fontSize: '0.65rem' }}>{w.status}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Landmark size={12} /> {w.bank_account}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                      Requested: {new Date(w.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  {w.proof_image && (
                    <a href={`http://localhost:5000${w.proof_image}`} target="_blank" rel="noreferrer" style={{ 
                      padding: '8px 12px', 
                      borderRadius: '8px', 
                      background: 'rgba(124, 58, 237, 0.1)', 
                      color: 'var(--primary)',
                      textDecoration: 'none',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <FileText size={14} /> Receipt
                    </a>
                  )}
                  {w.status === 'rejected' && (
                    <div title="This request was rejected and balance was refunded" style={{ color: 'var(--danger-text)' }}>
                      <XCircle size={20} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
