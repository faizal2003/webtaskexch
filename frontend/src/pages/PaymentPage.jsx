import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Upload, ChevronRight, AlertCircle } from 'lucide-react';

export default function PaymentPage() {
  const { taskId } = useParams();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('deposit_proof', file);

    try {
      await axios.post(`/tasks/${taskId}/payment`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("Payment proof submitted! Awaiting admin approval.");
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || "Error uploading proof");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Finalize Payment</h1>
          <p className="page-subtitle">Scan the QR code and upload your deposit proof</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '32px', alignItems: 'start' }}>
        {/* QR Section */}
        <div className="auth-card" style={{ textAlign: 'center', padding: '24px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '1rem' }}>Scan to Pay</h3>
          <img 
            src="/qr.jpeg" 
            alt="Payment QR Code" 
            style={{ width: '100%', borderRadius: '12px', marginBottom: '16px', border: '1px solid var(--border-color)' }} 
          />
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
            <AlertCircle size={14} />
            Scan using any QRIS supported app
          </div>
        </div>

        {/* Upload Section */}
        <div className="auth-card" style={{ padding: '32px' }}>
          <h3 style={{ marginBottom: '8px' }}>Upload Deposit Proof</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
            Please upload a screenshot of your successful transaction.
          </p>

          {error && <div style={{ color: 'var(--danger-text)', marginBottom: '16px', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px' }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <div style={{ position: 'relative' }}>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer', zIndex: 2 }} 
                />
                <div style={{ 
                  background: 'var(--sidebar-bg)', 
                  border: '2px dashed var(--border-color)', 
                  padding: '40px 24px', 
                  borderRadius: '16px', 
                  textAlign: 'center', 
                  color: 'var(--text-muted)',
                  transition: '0.3s'
                }}>
                  {file ? (
                    <div style={{ color: 'var(--primary)', fontWeight: '600' }}>
                      <CheckIcon />
                      {file.name}
                    </div>
                  ) : (
                    <>
                      <Upload size={32} style={{ marginBottom: '12px', color: 'var(--primary)' }} />
                      <div style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '4px' }}>Choose a file</div>
                      <div style={{ fontSize: '0.8rem' }}>PNG, JPG or JPEG up to 10MB</div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading} 
              style={{ width: '100%', justifyContent: 'center', height: '48px', marginTop: '16px' }}
            >
              {loading ? "Uploading..." : "Submit Proof"}
            </button>
            
            <button 
              type="button" 
              onClick={() => navigate('/dashboard')}
              style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-muted)', marginTop: '16px', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              Skip for now (I will upload later)
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <div style={{ width: '40px', height: '40px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
    </div>
  );
}
