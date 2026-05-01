import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [step, setStep] = useState(1); // 1: Register, 2: Verify OTP
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('/auth/register', { username, email, password });
      setMessage(res.data.message);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post('/auth/verify-otp', { username, otp });
      alert("Verification successful, please login.");
      navigate('/login');
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
        {step === 1 ? (
          <>
            <h2>Create Account</h2>
            <p>Join our community today</p>
            
            {error && <div className="error-message">{error}</div>}
            
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
                <label>Email</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="Enter your email"
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
            </div>
          </>
        ) : (
          <>
            <h2>Verify Email</h2>
            <p>Enter the 6-digit OTP sent to your email</p>
            
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
            <button onClick={() => setStep(1)} className="btn-link" style={{ display: 'block', margin: '10px auto', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>Back to Registration</button>
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
          borderRadius: 8px;
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
