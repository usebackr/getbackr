'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/navigation';

export default function IdentityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmission, setHasSubmission] = useState(false);
  const [showIdForm, setShowIdForm] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
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

  async function checkStatus() {
    try {
      const res = await fetch('/api/user/profile');
      const data = await res.json();
      if (data.user) {
        setStatus(data.user.kycStatus);
        setRejectionReason(data.user.kycRejectionReason);
        setHasSubmission(data.user.hasKycSubmission);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkStatus();
  }, []);

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset your verification? This will allow you to re-upload documents.')) return;
    setLoading(true);
    try {
      await fetch('/api/user/kyc/reset', { method: 'POST' });
      await checkStatus();
    } catch (err) {
      setError('Failed to reset verification');
    } finally {
      setLoading(false);
    }
  };

  const MAX_SIZE_MB = 2;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, name: 'idDoc' | 'selfie') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_SIZE_BYTES) {
      setError(`${name === 'idDoc' ? 'ID document' : 'Selfie'} must be under ${MAX_SIZE_MB}MB. Please use a smaller or compressed image.`);
      e.target.value = '';
      return;
    }

    setError('');
    setFiles({ ...files, [name]: file });
    setPreviews({ ...previews, [name]: URL.createObjectURL(file) });
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
        setSuccess('Verification Submitted Successfully! Your identity is now under review.');
        setStatus('pending');
        setHasSubmission(true);
        setShowIdForm(false);
      } else {
        const data = await res.json();
        setError(data.error || 'Verification submission failed');
      }
    } catch (err) {
      setError('A network error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontWeight: 600, color: '#64748b' }}>Loading Profile...</p>
    </div>
  );

  const shouldShowForm = status === 'unsubmitted' || status === 'rejected' || (status === 'pending' && !hasSubmission) || showIdForm;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar />
      <main className="dash-main" style={{ flex: 1 }}>
        <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '8px', fontWeight: 900, fontFamily: 'Outfit, sans-serif' }}>Identity Verification</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
              Verify your identity to unlock withdrawals and premium campaign features.
            </p>
          </div>
          {(status === 'pending' || status === 'rejected') && !shouldShowForm && (
            <button 
              onClick={() => setShowIdForm(true)}
              className="btn-outline" 
              style={{ padding: '10px 20px', fontSize: '0.9rem' }}
            >
              Re-upload Documents
            </button>
          )}
        </header>

        <div style={{ maxWidth: '800px' }}>
          {!shouldShowForm && status === 'pending' ? (
            <div className="dash-card" style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '40px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '16px', fontWeight: 800 }}>Verification Pending</h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto', lineHeight: 1.6 }}>
                We are currently reviewing your documents. This usually takes 24-48 hours. 
                You'll receive an email as soon as your status is updated!
              </p>
              
              <div style={{ marginTop: '32px', borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '12px' }}>Stuck? If you believe there was an error in your submission, you can reset it.</p>
                <button 
                  onClick={handleReset}
                  style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' }}
                >
                  Reset & Re-upload
                </button>
              </div>
            </div>
          ) : !shouldShowForm && status === 'verified' ? (
            <div className="dash-card" style={{ textAlign: 'center', padding: '60px', border: '2px solid #10b981' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '40px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '16px', color: '#10b981', fontWeight: 800 }}>Account Verified</h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto', lineHeight: 1.6 }}>
                Your identity has been confirmed. You now have full access to all withdrawal features!
              </p>
            </div>
          ) : (
            <div className="dash-card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '32px', borderBottom: '1px solid #f1f5f9' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '4px', fontWeight: 800 }}>Upload Documents</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>All information is handled securely and encrypted.</p>
              </div>

              <div style={{ padding: '32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                   {error && <div style={{ padding: '12px', background: '#fef2f2', color: '#ef4444', borderRadius: '8px', marginBottom: '16px', fontWeight: 600 }}>{error}</div>}
                   {success && <div style={{ padding: '12px', background: '#ecfdf5', color: '#10b981', borderRadius: '8px', marginBottom: '16px', fontWeight: 600 }}>{success}</div>}
                   
                   {status === 'rejected' && rejectionReason && (
                     <div style={{ padding: '16px', background: '#fff1f2', border: '1px solid #fda4af', borderRadius: '12px', marginBottom: '24px' }}>
                       <h4 style={{ margin: '0 0 4px', fontSize: '0.85rem', fontWeight: 800, color: '#be123c', textTransform: 'uppercase' }}>Verification Update: Rejected</h4>
                       <p style={{ margin: 0, fontSize: '0.95rem', color: '#9f1239', fontWeight: 500 }}>Reason: {rejectionReason}</p>
                       <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: '#e11d48', opacity: 0.8 }}>Please re-upload clearer documents to continue.</p>
                     </div>
                   )}
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Full Legal Name</label>
                  <input 
                    type="text" 
                    value={formData.legalName}
                    onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                    placeholder="As shown on your government ID" 
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
                    <option value="Passport">International Passport</option>
                    <option value="NIN">NIN (Slip or Card)</option>
                    <option value="Voters Card">Voter's Card</option>
                    <option value="Drivers License">Driver's License</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>ID Number</label>
                  <input 
                    type="text" 
                    value={formData.idNumber}
                    onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                    placeholder="Enter official ID Number" 
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} 
                  />
                </div>

                {/* Upload Areas */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', minHeight: '40px' }}>
                    ID Document — Front Page <br/>
                    <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: '0.75rem' }}>(Passport, NIN, or License • max 2MB)</span>
                  </label>
                  <div 
                    onClick={() => document.getElementById('id-upload')?.click()}
                    style={{ 
                      flex: 1, height: '180px', border: '2px dashed #e2e8f0', borderRadius: '20px', 
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      background: previews.idDoc ? `url(${previews.idDoc}) center/cover no-repeat` : '#f8fafc',
                      cursor: 'pointer', transition: 'border-color 0.2s', textAlign: 'center'
                    }}
                  >
                    {!previews.idDoc && (
                      <div style={{ padding: '0 16px' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px' }}><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>Tap to upload ID</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>Clear photo of front page</div>
                      </div>
                    )}
                  </div>
                  <input type="file" id="id-upload" style={{ display: 'none' }} accept="image/*" onChange={(e) => handleFileChange(e, 'idDoc')} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', minHeight: '40px' }}>
                    Selfie — Holding Your ID <br/>
                    <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: '0.75rem' }}>(Face clearly visible • max 2MB)</span>
                  </label>
                  <div 
                    onClick={() => document.getElementById('selfie-upload')?.click()}
                    style={{ 
                      flex: 1, height: '180px', border: '2px dashed #e2e8f0', borderRadius: '20px', 
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      background: previews.selfie ? `url(${previews.selfie}) center/cover no-repeat` : '#f8fafc',
                      cursor: 'pointer', textAlign: 'center'
                    }}
                  >
                    {!previews.selfie && (
                      <div style={{ padding: '0 16px' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px' }}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>Tap to take selfie</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>Hold ID next to your face</div>
                      </div>
                    )}
                  </div>
                  <input type="file" id="selfie-upload" style={{ display: 'none' }} accept="image/*" capture="user" onChange={(e) => handleFileChange(e, 'selfie')} />
                </div>

                <div style={{ gridColumn: '1 / -1', marginTop: '16px' }}>
                   <button 
                    disabled={submitting} 
                    onClick={handleSubmit} 
                    className="btn-primary" 
                    style={{ width: '100%', padding: '16px', fontSize: '1.1rem', fontWeight: 800 }}
                   >
                     {submitting ? 'Submitting Documents...' : 'Submit Verification'}
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
