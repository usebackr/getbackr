'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/navigation';

export default function IdentityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [status, setStatus] = useState('pending');

  const [kycData, setKycData] = useState({
    legalName: '',
    idType: 'National ID',
    idNumber: '',
    documentUrl: '',
  });

  useEffect(() => {
    fetch('/api/user/kyc')
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          setKycData({
            legalName: data.profile.legalName || '',
            idType: data.profile.idType || 'National ID',
            idNumber: data.profile.idNumber || '',
            documentUrl: data.profile.documentUrl || '',
          });
        }
        if (data.status) setStatus(data.status);
      })
      .catch(() => setError('Failed to load verification status'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setKycData({ ...kycData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/user/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kycData),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Validation failed');
      } else {
        setSuccess('Identity verified successfully! You are now eligible to receive payouts.');
        setStatus('verified');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <main className="dash-main" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontWeight: 600 }}>Loading identity status...</p>
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />

      <main className="dash-main" style={{ flex: 1, background: '#f8fafc' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
              marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600
            }}
          >
            ← Back to Dashboard
          </button>

          <header style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px' }}>Identity Verification</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Securely verify your identity to enable campaign payouts.</p>
          </header>

          <div className="card" style={{ padding: 'clamp(24px, 5vw, 40px)', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Verification Details</h2>
              <span
                style={{
                  padding: '8px 16px', borderRadius: '24px', fontSize: '0.85rem', fontWeight: 800,
                  background: status === 'verified' ? '#dcfce7' : '#fef3c7',
                  color: status === 'verified' ? '#166534' : '#92400e',
                }}
              >
                {status === 'verified' ? 'VERIFIED' : 'ACTION REQUIRED'}
              </span>
            </div>

            {error && <div style={{ padding: '12px', background: '#fef2f2', color: '#ef4444', borderRadius: '12px', marginBottom: '24px', fontWeight: 600 }}>{error}</div>}
            {success && <div style={{ padding: '16px', background: '#dcfce7', color: '#166534', borderRadius: '12px', marginBottom: '24px', fontWeight: 700 }}>{success}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>Full Legal Name</label>
                <input
                  type="text" name="legalName" value={kycData.legalName} onChange={handleChange}
                  placeholder="Matching your government ID"
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: status === 'verified' ? '#f8fafc' : '#fff' }}
                  disabled={status === 'verified'}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>ID Type</label>
                  <select
                    name="idType" value={kycData.idType} onChange={handleChange}
                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: status === 'verified' ? '#f8fafc' : '#fff' }}
                    disabled={status === 'verified'}
                  >
                    <option value="National ID">National ID / NIN</option>
                    <option value="Passport">International Passport</option>
                    <option value="Driver License">Driver's License</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>ID Number</label>
                  <input
                    type="text" name="idNumber" value={kycData.idNumber} onChange={handleChange}
                    placeholder="ABC-12345"
                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: status === 'verified' ? '#f8fafc' : '#fff' }}
                    disabled={status === 'verified'}
                  />
                </div>
              </div>

              {status !== 'verified' && (
                <button
                  onClick={handleSave}
                  disabled={saving || !kycData.legalName || !kycData.idNumber}
                  className="btn-primary"
                  style={{ padding: '16px', marginTop: '16px', fontSize: '1rem' }}
                >
                  {saving ? 'Verifying Details...' : 'Submit for Verification'}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
