'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/navigation';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import BackToDashboardButton from '@/components/dashboard/BackToDashboardButton';

import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

function PushToggle() {
  const { isSupported, isSubscribed, loading, permission, subscribe, unsubscribe } =
    usePushNotifications();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <button
        onClick={isSubscribed ? unsubscribe : subscribe}
        disabled={loading || !isSupported || permission === 'denied'}
        className={isSubscribed ? 'btn-secondary' : 'btn-primary'}
        style={{ padding: '12px 24px' }}
      >
        {loading
          ? 'Updating...'
          : isSubscribed
            ? 'Disable Push Notifications'
            : 'Enable Push Notifications'}
      </button>
      {permission === 'denied' && (
        <span style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>
          Push notifications are blocked by your browser. Please unblock them in settings.
        </span>
      )}
      {!isSupported && !loading && (
        <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
          Push notifications are not supported on this browser.
        </span>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Password');

  const tabs = ['Password', 'Payment and Payouts', 'Notifications'];

  // Payout states
  const [banks, setBanks] = useState<{ name: string; code: string }[]>([]);
  const [selectedBankCode, setSelectedBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [hasExistingBank, setHasExistingBank] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpContext, setOtpContext] = useState<'bank' | 'password'>('bank');

  // Password states
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');

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
          setHasExistingBank(true);
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

  const initiateSave = async () => {
    if (!accountName) return;

    if (hasExistingBank) {
      setSendingOtp(true);
      try {
        const res = await fetch('/api/auth/otp/bank-change', { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
          setOtpContext('bank');
          setShowOtpModal(true);
        } else {
          setResolveError(data.error || 'Failed to send OTP.');
        }
      } catch (err) {
        setResolveError('Network error sending OTP.');
      } finally {
        setSendingOtp(false);
      }
      return;
    }

    executeSave();
  };

  const executeSave = async (otp?: string) => {
    setSaving(true);
    setSaveSuccess(false);
    setOtpError('');

    const bank = banks.find((b) => b.code === selectedBankCode);

    try {
      const res = await fetch('/api/user/bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankName: bank?.name,
          bankCode: selectedBankCode,
          accountNumber,
          otp,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (otp) {
          setOtpError(data.error);
        } else {
          setResolveError(data.error);
        }
      } else {
        setSaveSuccess(true);
        setShowOtpModal(false);
        setHasExistingBank(true);
        setTimeout(() => setSaveSuccess(false), 5000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const initiatePasswordSave = async () => {
    if (newPassword !== newPasswordConfirm) {
      setResolveError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setResolveError('Password must be at least 8 characters');
      return;
    }

    setSendingOtp(true);
    setResolveError('');
    try {
      const res = await fetch('/api/auth/otp/password-change', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setOtpContext('password');
        setShowOtpModal(true);
      } else {
        setResolveError(data.error || 'Failed to send OTP.');
      }
    } catch (err) {
      setResolveError('Network error sending OTP.');
    } finally {
      setSendingOtp(false);
    }
  };

  const executePasswordSave = async (otp: string) => {
    setSaving(true);
    setSaveSuccess(false);
    setOtpError('');

    try {
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || 'Failed to change password');
      } else {
        setSaveSuccess(true);
        setShowOtpModal(false);
        setNewPassword('');
        setNewPasswordConfirm('');
        setTimeout(() => setSaveSuccess(false), 5000);
      }
    } catch (err) {
      console.error(err);
      setOtpError('Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />

      <main className="dash-main" style={{ flex: 1, background: '#f8fafc' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <BackToDashboardButton />

          <header style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px' }}>Settings</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
              Manage your account, security, and payout methods.
            </p>
          </header>

          <div
            style={{
              display: 'flex',
              gap: '24px',
              borderBottom: '1px solid #e2e8f0',
              marginBottom: '32px',
              overflowX: 'auto',
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
                  whiteSpace: 'nowrap',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'Payment and Payouts' && (
            <div className="card" style={{ padding: 'clamp(24px, 5vw, 40px)', background: '#fff' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '24px', fontWeight: 800 }}>
                Bank Account Details
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.6 }}>
                Add your local bank account to receive campaign payouts directly and securely.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: '#475569',
                    }}
                  >
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
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: '#475569',
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
                      padding: '14px',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                    }}
                  />
                </div>

                <div style={{ minHeight: '60px' }}>
                  {resolving && (
                    <span
                      style={{
                        color: 'var(--accent-secondary)',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <Loader2 className="animate-spin" size={18} /> Resolving account name...
                    </span>
                  )}
                  {resolveError && (
                    <span
                      style={{
                        color: '#ef4444',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <AlertCircle size={18} /> {resolveError}
                    </span>
                  )}
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
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          color: 'var(--accent-primary)',
                          fontSize: '1.1rem',
                          fontWeight: 700,
                          marginTop: '4px',
                        }}
                      >
                        {accountName} <CheckCircle2 size={20} />
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '8px' }}>
                  <button
                    onClick={initiateSave}
                    disabled={!accountName || saving || sendingOtp}
                    className="btn-primary"
                    style={{
                      width: '100%',
                      padding: '16px',
                      opacity: !accountName || saving || sendingOtp ? 0.5 : 1,
                    }}
                  >
                    {saving
                      ? 'Saving Details...'
                      : sendingOtp
                        ? 'Sending OTP...'
                        : 'Save Bank Account'}
                  </button>
                </div>

                {saveSuccess && (
                  <p
                    style={{
                      color: '#059669',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      textAlign: 'center',
                    }}
                  >
                    Bank details saved successfully!
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'Password' && (
            <div className="card" style={{ padding: 'clamp(24px, 5vw, 40px)', background: '#fff' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '24px', fontWeight: 800 }}>
                Security Settings
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.6 }}>
                Update your account password. For your security, you will need to confirm this change with a code sent to your email.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="At least 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Repeat new password"
                    value={newPasswordConfirm}
                    onChange={(e) => setNewPasswordConfirm(e.target.value)}
                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  />
                </div>

                {resolveError && activeTab === 'Password' && (
                  <span style={{ color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={18} /> {resolveError}
                  </span>
                )}

                <div style={{ marginTop: '8px' }}>
                  <button
                    onClick={initiatePasswordSave}
                    disabled={saving || sendingOtp || !newPassword || !newPasswordConfirm}
                    className="btn-primary"
                    style={{ width: '100%', padding: '16px', opacity: (saving || sendingOtp || !newPassword || !newPasswordConfirm) ? 0.5 : 1 }}
                  >
                    {saving ? 'Processing...' : sendingOtp ? 'Sending OTP...' : 'Change Password'}
                  </button>
                </div>

                {saveSuccess && (
                  <p style={{ color: '#059669', fontSize: '0.95rem', fontWeight: 700, textAlign: 'center' }}>
                    Password updated successfully!
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'Notifications' && (
            <div className="card" style={{ padding: 'clamp(24px, 5vw, 40px)', background: '#fff' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '24px', fontWeight: 800 }}>
                Push Notifications
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.6 }}>
                Receive instant alerts on this device when you get a new donation, withdrawal
                update, or KYC approval.
              </p>
              <PushToggle />
            </div>
          )}

          {activeTab !== 'Payment and Payouts' && activeTab !== 'Notifications' && activeTab !== 'Password' && (
            <div
              style={{
                padding: '40px',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                background: '#fff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
              }}
            >
              <p style={{ fontWeight: 600 }}>
                The {activeTab} section is currently being optimized.
              </p>
            </div>
          )}
        </div>

        {/* OTP Prompt Modal */}
        {showOtpModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.4)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            <div
              style={{
                background: '#fff',
                padding: '32px',
                borderRadius: '16px',
                maxWidth: '400px',
                width: '90%',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              }}
            >
              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  marginBottom: '16px',
                  color: '#0f172a',
                }}
              >
                Security Check
              </h3>
              <p
                style={{
                  color: '#64748b',
                  fontSize: '0.9rem',
                  marginBottom: '24px',
                  lineHeight: 1.5,
                }}
              >
                {otpContext === 'bank' 
                  ? "To protect your platform earnings, we've sent a 6-digit confirmation code to your email. Please enter it to authorize updating your bank details."
                  : "To secure your account, we've sent a 6-digit confirmation code to your email. Please enter it to authorize updating your password."}
              </p>

              {otpError && (
                <div
                  style={{
                    background: '#fef2f2',
                    color: '#ef4444',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  {otpError}
                </div>
              )}

              <input
                type="text"
                placeholder="123456"
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '2px solid #e2e8f0',
                  fontSize: '1.25rem',
                  textAlign: 'center',
                  letterSpacing: '4px',
                  fontWeight: 700,
                  marginBottom: '24px',
                }}
              />

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowOtpModal(false)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '14px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => otpContext === 'bank' ? executeSave(otpInput) : executePasswordSave(otpInput)}
                  disabled={otpInput.length !== 6 || saving}
                  className="btn-primary"
                  style={{
                    flex: 1,
                    padding: '14px',
                    opacity: otpInput.length !== 6 || saving ? 0.5 : 1,
                  }}
                >
                  {saving ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
