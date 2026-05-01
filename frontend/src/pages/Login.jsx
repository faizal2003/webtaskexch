import { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

export default function Login({ login }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isUnverified, setIsUnverified] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('/auth/login', { username, password });
      login(res.data.user, res.data.token);
    } catch (err) {
      if (err.response?.data?.unverified) {
        setIsUnverified(true);
        setError(err.response.data.error);
      } else {
        setError(err.response?.data?.error || 'Login failed');
      }
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post('/auth/verify-otp', { username, otp });
      alert("Verification successful, you can now login.");
      setIsUnverified(false);
      setOtp('');
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed');
    }
  };

  const handleResendOtp = async () => {
    setError('');
    try {
      const res = await axios.post('/auth/resend-otp', { username });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend OTP');
    }
  };

  return (
    <div className="auth-wrapper fade-in">
      <div className="auth-card">
        {!isUnverified ? (
          <>
            <h2>Welcome Back</h2>
            <p>Sign in to your account to continue</p>
            
            {error && <div className="error-message">{error}</div>}
            
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Username</label>
                <input 
                  type="text" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                  placeholder="Enter your username"
                  required 
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="Enter your password"
                  required 
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>Login</button>
            </form>
            
            <div className="footer-text">
              Don't have an account? <Link to="/register">Create one</Link>
            </div>
          </>
        ) : (
          <>
            <h2>Verify Your Email</h2>
            <p>Enter the 6-digit OTP sent to your email for <strong>{username}</strong></p>
            
            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}
            
            <form onSubmit={handleVerifyOtp}>
              <div className="form-group">
                <label>OTP Code</label>
                <input 
                  type="text" 
                  value={otp} 
                  onChange={e => setOtp(e.target.value)} 
                  placeholder="123456"
                  maxLength="6"
                  required 
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>Verify OTP</button>
            </form>
            
            <div className="footer-text">
              Didn't receive code? <button onClick={handleResendOtp} className="btn-link" style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', padding: 0, font: 'inherit' }}>Resend OTP</button>
            </div>
            <button onClick={() => setIsUnverified(false)} className="btn-link" style={{ display: 'block', margin: '10px auto', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>Back to Login</button>
          </>
        )}
        
        <div className="footer-text" style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
          <div style={{ fontSize: '0.85rem' }}>
            By continuing, you agree to our <Link to="/terms">Terms and Conditions</Link>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .error-message {
          color: var(--danger-text);
          margin-bottom: 16px;
          text-align: center;
          background: rgba(239, 68, 68, 0.1);
          padding: 10px;
          border-radius: 8px;
        }
        .success-message {
          color: #10b981;
          margin-bottom: 16px;
          text-align: center;
          background: rgba(16, 185, 129, 0.1);
          padding: 10px;
          border-radius: 8px;
        }
      `}} />
    </div>
  );
}
