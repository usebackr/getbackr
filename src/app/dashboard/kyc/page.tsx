'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/navigation';

export default function KYCPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    legalName: '',
    idType: 'Passport',
    idNumber: '',
  });

  const [files, setFiles] = useState<{ idDoc: File | null; selfie: File | null }>({
    idDoc: null,
    selfie: null,
  });

  const [previews, setPreviews] = useState<{ idDoc: string; selfie: string }>({
    idDoc: '',
    selfie: '',
  });

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch('/api/user/profile');
        const data = await res.json();
        if (data.user) setStatus(data.user.kycStatus);
      } finally {
        setLoading(false);
      }
    }
    checkStatus();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, name: 'idDoc' | 'selfie') => {
    const file = e.target.files?.[0];
    if (file) {
      setFiles({ ...files, [name]: file });
      setPreviews({ ...previews, [name]: URL.createObjectURL(file) });
    }
  };

  const handleSubmit = async () => {
    if (!formData.legalName || !formData.idNumber || !files.idDoc || !files.selfie) {
      setError('Please fill in all fields and upload both documents.');
      return;
    }

    setSubmitting(true);
    setError('');
    
    try {
      const fd = new FormData();
      fd.append('legalName', formData.legalName);
      fd.append('idType', formData.idType);
      fd.append('idNumber', formData.idNumber);
      fd.append('id_document', files.idDoc);
      fd.append('selfie', files.selfie);

      const res = await fetch('/api/kyc/submit', {
        method: 'POST',
        body: fd,
      });

      if (res.ok) {
        setSuccess('KYC Submitted Successfully! Your verification is now pending.');
        setStatus('pending');
      } else {
        const data = await res.json();
        setError(data.error || 'KYC submission failed');
      }
    } catch (err) {
      setError('A network error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar />
      <main className="dash-main" style={{ flex: 1 }}>
        <header style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '4px', fontWeight: 900 }}>Identity Verification</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Complete your KYC to start receiving donations.
          </p>
        </header>

        <div style={{ maxWidth: '800px' }}>
          {status === 'pending' ? (
            <div className="dash-card" style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '4rem', marginBottom: '24px' }}>⏳</div>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '16px' }}>Verification Pending</h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
                We are currently reviewing your documents. This usually takes 24-48 hours. 
                You'll be notified as soon as you're verified!
              </p>
            </div>
          ) : status === 'verified' ? (
            <div className="dash-card" style={{ textAlign: 'center', padding: '60px', border: '2px solid #10b981' }}>
              <div style={{ fontSize: '4rem', marginBottom: '24px' }}>✅</div>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '16px', color: '#10b981' }}>Account Verified</h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
                Your identity has been confirmed. You now have full access to all features!
              </p>
            </div>
          ) : (
            <div className="dash-card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '32px', borderBottom: '1px solid #f1f5f9' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '4px', fontWeight: 800 }}>Submit Your Verification</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>All information is stored securely and encrypted.</p>
              </div>

              <div style={{ padding: '32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                   {error && <div style={{ padding: '12px', background: '#fef2f2', color: '#ef4444', borderRadius: '8px', marginBottom: '16px', fontWeight: 600 }}>{error}</div>}
                   {success && <div style={{ padding: '12px', background: '#ecfdf5', color: '#10b981', borderRadius: '8px', marginBottom: '16px', fontWeight: 600 }}>{success}</div>}
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Full Legal Name</label>
                  <input 
                    type="text" 
                    value={formData.legalName}
                    onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                    placeholder="As shown on your ID" 
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>ID Type</label>
                  <select 
                    value={formData.idType}
                    onChange={(e) => setFormData({ ...formData, idType: e.target.value })}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                  >
                    <option>Passport</option>
                    <option>NIN (Slip/Card)</option>
                    <option>Voters Card</option>
                    <option>Drivers License</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>ID Number</label>
                  <input 
                    type="text" 
                    value={formData.idNumber}
                    onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                    placeholder="Enter ID Number" 
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} 
                  />
                </div>

                {/* Upload Areas */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>ID Document (Front)</label>
                  <div 
                    onClick={() => document.getElementById('id-upload')?.click()}
                    style={{ 
                      height: '160px', border: '2px dashed #e2e8f0', borderRadius: '20px', 
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      background: previews.idDoc ? `url(${previews.idDoc}) center/cover no-repeat` : '#f8fafc',
                      cursor: 'pointer', transition: 'border-color 0.2s'
                    }}
                  >
                    {!previews.idDoc && <><span style={{ fontSize: '1.5rem', marginBottom: '8px' }}>📷</span><span style={{ fontSize: '0.8rem', color: '#64748b' }}>Select File</span></>}
                  </div>
                  <input type="file" id="id-upload" style={{ display: 'none' }} accept="image/*" onChange={(e) => handleFileChange(e, 'idDoc')} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Selfie (Holding ID)</label>
                  <div 
                    onClick={() => document.getElementById('selfie-upload')?.click()}
                    style={{ 
                      height: '160px', border: '2px dashed #e2e8f0', borderRadius: '20px', 
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      background: previews.selfie ? `url(${previews.selfie}) center/cover no-repeat` : '#f8fafc',
                      cursor: 'pointer'
                    }}
                  >
                    {!previews.selfie && <><span style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🤳</span><span style={{ fontSize: '0.8rem', color: '#64748b' }}>Take Photo</span></>}
                  </div>
                  <input type="file" id="selfie-upload" style={{ display: 'none' }} accept="image/*" capture="user" onChange={(e) => handleFileChange(e, 'selfie')} />
                </div>

                <div style={{ gridColumn: '1 / -1', marginTop: '16px' }}>
                   <button 
                    disabled={submitting} 
                    onClick={handleSubmit} 
                    className="btn-primary" 
                    style={{ width: '100%', padding: '16px', fontSize: '1rem' }}
                   >
                     {submitting ? 'Submitting Verification...' : 'Submit Verification'}
                   </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
