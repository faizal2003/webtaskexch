import { Link, useLocation } from 'react-router-dom';
import { Home, Users, CheckSquare, Gift, ShieldAlert, User, HelpCircle, LogOut } from 'lucide-react';

export default function Sidebar({ user, logout }) {
  const location = useLocation();

  if (!user) return null;

  return (
    <div className="sidebar">
      <div className="logo">
        <div style={{ color: '#7C3AED' }}><CheckSquare /></div>
        webtask
      </div>

      <div className="menu-section">GENERAL</div>
      <Link to="/" className={`menu-link ${location.pathname === '/' ? 'active' : ''}`}>
        <Home size={18} /> Overview
      </Link>
      
      <Link to="/#disabled" className="menu-link" style={{ opacity: 0.5, pointerEvents: 'none' }}>
        <Users size={18} /> My People
      </Link>
      
      <Link to="/dashboard" className={`menu-link ${location.pathname.startsWith('/dashboard') || location.pathname === '/create' ? 'active' : ''}`}>
        <CheckSquare size={18} /> Manage Task
      </Link>

      <Link to="/#disabled" className="menu-link" style={{ opacity: 0.5, pointerEvents: 'none' }}>
        <Gift size={18} /> Rewards
      </Link>

      {user.role === 'admin' && (
        <Link to="/admin" className={`menu-link ${location.pathname === '/admin' ? 'active' : ''}`}>
          <ShieldAlert size={18} /> Admin Panel
        </Link>
      )}

      <div className="menu-section">OTHERS</div>
      <Link to="/profile" className={`menu-link ${location.pathname === '/profile' ? 'active' : ''}`}>
        <User size={18} /> Profile
      </Link>
      
      <Link to="/terms" className={`menu-link ${location.pathname === '/terms' ? 'active' : ''}`}>
        <HelpCircle size={18} /> Terms & Conditions
      </Link>

      <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border-color)', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px' }}>
          <div style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '50%', 
            background: 'var(--primary)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            overflow: 'hidden'
          }}>
            {user.profile_picture ? (
              <img src={`http://localhost:5000${user.profile_picture}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              user.username.charAt(0).toUpperCase()
            )}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.username}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user.role}</div>
          </div>
        </div>
      </div>

      <a href="#" onClick={(e) => { e.preventDefault(); logout(); }} className="menu-link">
        <LogOut size={18} /> Logout
      </a>
    </div>
  );
}
