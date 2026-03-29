'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Payment and Payouts');

  const tabs = ['Profile', 'Password', 'Payment and Payouts'];

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
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px' }}>Settings</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Manage your account, security, and payout methods.</p>
          </header>

          <div
            style={{
              display: 'flex',
              gap: '24px',
              borderBottom: '1px solid #e2e8f0',
              marginBottom: '32px',
              overflowX: 'auto'
            }}
            className="hide-scrollbar"
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
                  fontWeight: activeTab === tab ? 700 : 500,
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'Payment and Payouts' && (
            <div className="card" style={{ padding: 'clamp(24px, 5vw, 40px)', background: '#fff' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '24px', fontWeight: 800 }}>Bank Account Details</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.6 }}>
                Add your local bank account to receive campaign payouts directly and securely.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>
                    Bank Name
                  </label>
                  <select
                    value={selectedBankCode}
                    onChange={(e) => setSelectedBankCode(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '12px',
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
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>
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
                      padding: '14px',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                    }}
                  />
                </div>

                <div style={{ minHeight: '60px' }}>
                  {resolving && (
                    <span style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>
                      Resolving account name... ⏳
                    </span>
                  )}
                  {resolveError && <span style={{ color: '#ef4444', fontWeight: 600 }}>{resolveError} ❌</span>}
                  {accountName && !resolving && (
                    <div
                      style={{
                        padding: '16px',
                        background: '#f8fafc',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                        Account Name:
                      </span>
                      <br />
                      <strong style={{ color: 'var(--accent-primary)', fontSize: '1.1rem' }}>{accountName} ✅</strong>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '8px' }}>
                  <button
                    onClick={handleSave}
                    disabled={!accountName || saving}
                    className="btn-primary"
                    style={{ width: '100%', padding: '16px', opacity: !accountName || saving ? 0.5 : 1 }}
                  >
                    {saving ? 'Saving Details...' : 'Save Bank Account'}
                  </button>
                </div>

                {saveSuccess && (
                  <p style={{ color: '#059669', fontSize: '0.95rem', fontWeight: 700, textAlign: 'center' }}>Bank details saved successfully!</p>
                )}
              </div>
            </div>
          )}

          {activeTab !== 'Payment and Payouts' && (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <p style={{ fontWeight: 600 }}>The {activeTab} section is currently being optimized.</p>
            </div>
          )}
        </div>
      </main>
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
