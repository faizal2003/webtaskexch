import { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldAlert, Trash2 } from 'lucide-react';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`/admin/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || "Error deleting user");
    }
  };

  if (loading) return <div className="container">Loading users...</div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Control Panel</h1>
          <p className="page-subtitle">Manage platform users and moderation.</p>
        </div>
      </div>
      
      <div style={{ background: 'var(--item-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
              <th style={{ padding: '16px' }}>ID</th>
              <th style={{ padding: '16px' }}>Username</th>
              <th style={{ padding: '16px' }}>Points</th>
              <th style={{ padding: '16px' }}>Role</th>
              <th style={{ padding: '16px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--card-border)' }}>
                <td style={{ padding: '16px' }}>{u.id}</td>
                <td style={{ padding: '16px', fontWeight: 600 }}>{u.username}</td>
                <td style={{ padding: '16px' }}>{u.points}</td>
                <td style={{ padding: '16px' }}>
                  <span className={`badge ${u.role === 'admin' ? 'completed' : 'open'}`}>
                    {u.role}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>
                  {u.role !== 'admin' && (
                    <button className="btn-danger" style={{ padding: '6px 12px' }} onClick={() => handleDelete(u.id)}>
                      <Trash2 size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Delete
                    </button>
                  )}
                  {u.role === 'admin' && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}><ShieldAlert size={14} style={{ verticalAlign: 'middle' }}/> Superuser</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
