import { Search, Bell, Mail } from 'lucide-react';

export default function Topbar({ user }) {
  if (!user) return null;

  return (
    <div className="topbar">
      <div className="search-box">
        <Search size={18} color="var(--text-muted)" />
        <input type="text" placeholder="Search by report name..." />
      </div>
      
      <div className="top-icons">
        <button className="icon-btn"><Bell size={18} /></button>
        <button className="icon-btn"><Mail size={18} /></button>
        
        <div className="user-profile">
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Howdy,</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user.username}</div>
          </div>
          <div style={{ width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            {user.username.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
}
