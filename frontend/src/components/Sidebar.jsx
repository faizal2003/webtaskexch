import { Link, useLocation } from 'react-router-dom';
import { Home, Users, CheckSquare, Gift, ShieldAlert, Settings, HelpCircle, LogOut } from 'lucide-react';

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
      <Link to="/#disabled" className="menu-link" style={{ opacity: 0.5, pointerEvents: 'none' }}>
        <Settings size={18} /> Settings
      </Link>
      
      <Link to="/#disabled" className="menu-link" style={{ opacity: 0.5, pointerEvents: 'none' }}>
        <HelpCircle size={18} /> Help Center
      </Link>

      <a href="#" onClick={(e) => { e.preventDefault(); logout(); }} className="menu-link">
        <LogOut size={18} /> Logout
      </a>
    </div>
  );
}
