import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/auth/register', { username, password });
      alert("Registration successful, please login.");
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="auth-wrapper fade-in">
      <div className="auth-card">
        <h2>Create Account</h2>
        <p>Join our community today</p>
        
        {error && <div style={{ color: 'var(--danger-text)', marginBottom: '16px', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px' }}>{error}</div>}
        
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              placeholder="Choose a username"
              required 
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="Choose a password"
              required 
            />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>Register</button>
        </form>
        
        <div className="footer-text">
          Already have an account? <Link to="/login">Sign in</Link>
          <div style={{ marginTop: '10px', fontSize: '0.85rem' }}>
            By registering, you agree to our <Link to="/terms">Terms and Conditions</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
