import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function TermsAndConditions() {
  return (
    <div className="container fade-in" style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <ShieldCheck size={32} color="var(--primary)" />
        <h1 style={{ margin: 0 }}>Terms and Conditions</h1>
      </div>
      
      <div className="card" style={{ padding: '30px', lineHeight: '1.6' }}>
        <p>Welcome to WebTask Exchange. By using our website, you agree to comply with and be bound by the following terms and conditions of use.</p>
        
        <h3>1. Acceptance of Terms</h3>
        <p>By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.</p>
        
        <h3>2. User Responsibilities</h3>
        <p>Users are responsible for maintaining the confidentiality of their account and password and for restricting access to their computer.</p>
        
        <h3>3. Task Completion and Payments</h3>
        <p>All tasks must be completed according to the instructions provided. Payments will be processed once tasks are verified by administrators.</p>
        
        <h3>4. Prohibited Activities</h3>
        <p>Users are prohibited from using the site for any unlawful purpose or to solicit others to perform or participate in any unlawful acts.</p>
        
        <h3>5. Modifications to Service</h3>
        <p>We reserve the right at any time to modify or discontinue the Service (or any part or content thereof) without notice at any time.</p>
        
        <p style={{ marginTop: '30px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Last updated: April 2024
        </p>
      </div>
    </div>
  );
}
