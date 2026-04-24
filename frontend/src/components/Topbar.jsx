import { Search, Bell, Mail, Check } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function Topbar({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      try {
        const res = await axios.get('/auth/notifications');
        setNotifications(res.data);
      } catch (err) {
        console.error('Failed to fetch notifications');
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async () => {
    try {
      await axios.put('/auth/notifications/read');
      setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error('Failed to mark notifications as read');
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!user) return null;

  return (
    <div className="topbar">
      {location.pathname !== '/profile' ? (
        <div className="search-box">
          <Search size={18} color="var(--text-muted)" />
          <input type="text" placeholder="Search by report name..." />
        </div>
      ) : <div />}
      
      <div className="top-icons">
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button 
            className="icon-btn" 
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications && unreadCount > 0) markAsRead();
            }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{ 
                position: 'absolute', 
                top: '8px', 
                right: '8px', 
                width: '10px', 
                height: '10px', 
                background: '#ef4444', 
                borderRadius: '50%', 
                border: '2px solid var(--card-bg)' 
              }} />
            )}
          </button>

          {showNotifications && (
            <div className="card shadow-lg" style={{ 
              position: 'absolute', 
              top: '50px', 
              right: 0, 
              width: '320px', 
              zIndex: 1000, 
              padding: '16px',
              maxHeight: '400px',
              overflowY: 'auto',
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ margin: 0 }}>Notifications</h4>
                {unreadCount > 0 && <span style={{ fontSize: '0.75rem', color: 'var(--primary)', cursor: 'pointer' }} onClick={markAsRead}>Mark all as read</span>}
              </div>
              
              {notifications.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px 0' }}>No notifications yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {notifications.map(n => (
                    <div key={n.id} style={{ 
                      padding: '12px', 
                      borderRadius: '8px', 
                      background: n.is_read ? 'transparent' : 'rgba(124, 58, 237, 0.05)',
                      borderLeft: n.is_read ? 'none' : '3px solid var(--primary)',
                      fontSize: '0.85rem'
                    }}>
                      <div style={{ marginBottom: '4px' }}>{n.message}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(n.created_at).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <button className="icon-btn"><Mail size={18} /></button>
        
        <div className="user-profile" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Howdy,</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user.username}</div>
          </div>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            background: 'var(--primary)', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontWeight: 'bold',
            overflow: 'hidden'
          }}>
            {user.profile_picture ? (
              <img src={`http://localhost:5000${user.profile_picture}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              user.username.charAt(0).toUpperCase()
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
