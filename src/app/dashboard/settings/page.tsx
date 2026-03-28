'use client';

import React, { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Payment and Payouts');

  const tabs = ['KYC / Verification', 'Profile', 'Password', 'Payment and Payouts'];

  // Payout states
  const [banks, setBanks] = useState<{ name: string; code: string }[]>([]);
  const [selectedBankCode, setSelectedBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch banks on mount
  useEffect(() => {
    fetch('/api/payments/banks')
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setBanks(data);
      })
      .catch(console.error);

    // Fetch existing bank settings
    fetch('/api/user/bank')
      .then((res) => res.json())
      .then((data) => {
        if (data.account) {
          setSelectedBankCode(data.account.bankCode);
          setAccountNumber(data.account.accountNumber);
          setAccountName(data.account.accountName);
        }
      })
      .catch(console.error);
  }, []);

  // Resolve account when number is 10 digits
  useEffect(() => {
    if (accountNumber.length === 10 && selectedBankCode) {
      setResolving(true);
      setResolveError('');
      setAccountName('');

      fetch('/api/payments/resolve-bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountNumber, bankCode: selectedBankCode }),
      })
        .then(async (res) => {
          const data = await res.json();
          if (data.error) {
            setResolveError(data.error);
          } else {
            setAccountName(data.accountName);
          }
        })
        .catch(() => setResolveError('Network error resolving account'))
        .finally(() => setResolving(false));
    } else {
      setAccountName('');
      setResolveError('');
    }
  }, [accountNumber, selectedBankCode]);

  const handleSave = async () => {
    if (!accountName) return;
    setSaving(true);
    setSaveSuccess(false);

    const bank = banks.find((b) => b.code === selectedBankCode);

    try {
      const res = await fetch('/api/user/bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankName: bank?.name,
          bankCode: selectedBankCode,
          accountNumber,
        }),
      });
      const data = await res.json();
      if (!data.error) setSaveSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-page" style={{ padding: '32px', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '24px' }}>Settings</h1>

      <div
        style={{
          display: 'flex',
          gap: '24px',
          borderBottom: '1px solid #e2e8f0',
          marginBottom: '32px',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 0',
              background: 'none',
              border: 'none',
              borderBottom:
                activeTab === tab ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === tab ? 600 : 400,
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Payment and Payouts' && (
        <div className="card" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '24px' }}>Bank Account Details</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Add your local bank account to receive campaign payouts directly.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '400px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary)',
                }}
              >
                Bank Name
              </label>
              <select
                value={selectedBankCode}
                onChange={(e) => setSelectedBankCode(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <option value="">Select your bank...</option>
                {banks.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary)',
                }}
              >
                Account Number
              </label>
              <input
                type="text"
                maxLength={10}
                placeholder="0000000000"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                }}
              />
            </div>

            <div style={{ minHeight: '60px' }}>
              {resolving && (
                <span style={{ color: 'var(--accent-secondary)' }}>
                  Resolving account name... ⏳
                </span>
              )}
              {resolveError && <span style={{ color: 'red' }}>{resolveError} ❌</span>}
              {accountName && !resolving && (
                <div
                  style={{
                    padding: '12px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Resolved Account Map:
                  </span>
                  <br />
                  <strong style={{ color: 'var(--accent-primary)' }}>{accountName} ✅</strong>
                </div>
              )}
            </div>

            <div style={{ marginTop: '16px', display: 'flex', gap: '16px' }}>
              <button
                onClick={handleSave}
                disabled={!accountName || saving}
                className="btn-primary"
                style={{ flex: 1, padding: '14px', opacity: !accountName || saving ? 0.5 : 1 }}
              >
                {saving ? 'Saving...' : 'Save Bank Account'}
              </button>
            </div>

            {saveSuccess && (
              <p style={{ color: 'green', fontSize: '0.9rem' }}>Bank details saved successfully!</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'KYC / Verification' && <KYCTab />}

      {activeTab !== 'Payment and Payouts' && activeTab !== 'KYC / Verification' && (
        <div style={{ color: 'var(--text-secondary)' }}>
          <p>This section ({activeTab}) is under construction.</p>
        </div>
      )}
    </div>
  );
}

function KYCTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [kycData, setKycData] = useState({
    legalName: '',
    idType: 'National ID',
    idNumber: '',
    documentUrl: '',
  });
  const [status, setStatus] = useState('pending');

  useEffect(() => {
    fetch('/api/user/kyc')
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          setKycData({
            legalName: data.profile.legalName,
            idType: data.profile.idType,
            idNumber: data.profile.idNumber,
            documentUrl: data.profile.documentUrl || '',
          });
        }
        if (data.status) setStatus(data.status);
      })
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

  if (loading) return <div>Loading verification status...</div>;

  return (
    <div className="card" style={{ padding: '32px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <h2 style={{ fontSize: '1.25rem' }}>Identity Verification</h2>
        <span
          style={{
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: 600,
            background: status === 'verified' ? '#dcfce7' : '#fef3c7',
            color: status === 'verified' ? '#166534' : '#92400e',
          }}
        >
          {status === 'verified' ? 'VERIFIED' : 'ACTION REQUIRED'}
        </span>
      </div>

      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
        To comply with local regulations and prevent fraud, securely verify your identity before
        withdrawing funds from your campaigns.
      </p>

      {error && (
        <div
          style={{
            padding: '12px',
            background: '#fef2f2',
            color: '#ef4444',
            borderRadius: '8px',
            marginBottom: '24px',
          }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          style={{
            padding: '12px',
            background: '#dcfce7',
            color: '#166534',
            borderRadius: '8px',
            marginBottom: '24px',
          }}
        >
          {success}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '480px' }}>
        <div>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
            }}
          >
            Full Legal Name
          </label>
          <input
            type="text"
            name="legalName"
            value={kycData.legalName}
            onChange={handleChange}
            placeholder="Matching your government ID"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}
            disabled={status === 'verified'}
          />
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
              }}
            >
              ID Type
            </label>
            <select
              name="idType"
              value={kycData.idType}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}
              disabled={status === 'verified'}
            >
              <option value="National ID">National ID / NIN</option>
              <option value="Passport">International Passport</option>
              <option value="Driver License">Driver's License</option>
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
              }}
            >
              ID Number
            </label>
            <input
              type="text"
              name="idNumber"
              value={kycData.idNumber}
              onChange={handleChange}
              placeholder="ABC-12345"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}
              disabled={status === 'verified'}
            />
          </div>
        </div>

        {status !== 'verified' && (
          <button
            onClick={handleSave}
            disabled={saving || !kycData.legalName || !kycData.idNumber}
            className="btn-primary"
            style={{ padding: '14px', marginTop: '16px' }}
          >
            {saving ? 'Verifying...' : 'Submit Verification'}
          </button>
        )}
      </div>
    </div>
  );
}
