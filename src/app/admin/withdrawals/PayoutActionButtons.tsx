'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PayoutActionButtons({ withdrawalId }: { withdrawalId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [reason, setReason] = useState('Insufficient verification / Invalid bank details');
  const [paystackBalance, setPaystackBalance] = useState<number | null>(null);

  // OTP State
  const [otpRequired, setOtpRequired] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [activeTransferCode, setActiveTransferCode] = useState('');

  useEffect(() => {
    async function fetchBalance() {
      try {
        const res = await fetch('/api/admin/payments/balance');
        const data = await res.json();
        if (data.balance !== undefined) setPaystackBalance(data.balance);
      } catch (err) {
        console.error('Failed to fetch balance', err);
      }
    }
    fetchBalance();
  }, []);

  const executeAction = async (
    action: 'completed' | 'rejected' | 'finalize_otp',
    isManual = false,
  ) => {
    if (action === 'completed') {
      const confirmMsg = isManual
        ? "Mark this as COMPLETED manually? This means you've already sent the funds via another bank and just want to close the request in the app."
        : 'Process automated bank transfer via Paystack for this amount?';

      if (!confirm(confirmMsg)) return;
    } else if (action === 'rejected') {
      if (!reason || reason.trim() === '') {
        alert('A rejection reason is strictly required to bounce funds.');
        return;
      }
    } else if (action === 'finalize_otp') {
      if (!otpValue || otpValue.length < 4) {
        alert('Please enter a valid OTP.');
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/withdrawals/${withdrawalId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: action,
          reason: action === 'rejected' ? reason.trim() : '',
          isManual,
          otp: action === 'finalize_otp' ? otpValue : undefined,
          transferCode: action === 'finalize_otp' ? activeTransferCode : undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || `Failed to process payout`);

      // Handle OTP Required from server
      if (data.otpRequired) {
        setOtpRequired(true);
        setActiveTransferCode(data.transferCode);
        setLoading(false);
        alert(data.message || 'OTP Required to continue.');
        return;
      }

      router.refresh();
      setIsRejecting(false);
      setOtpRequired(false);
      setOtpValue('');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
      setLoading(false);
    }
  };

  if (isRejecting) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '16px',
          background: '#fff1f2',
          borderRadius: '12px',
          border: '1px solid #fecaca',
        }}
      >
        <h4
          style={{
            fontSize: '0.9rem',
            fontWeight: 800,
            color: '#991b1b',
            textTransform: 'uppercase',
          }}
        >
          Rejection Feedback
        </h4>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why this request is being rejected..."
          style={{
            width: '100%',
            height: '80px',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #fecaca',
            fontSize: '0.9rem',
            outline: 'none',
            resize: 'none',
          }}
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => executeAction('rejected')}
            disabled={loading}
            style={{
              flex: 2,
              padding: '10px',
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem',
            }}
          >
            {loading ? 'Processing...' : 'Confirm Reject'}
          </button>
          <button
            onClick={() => setIsRejecting(false)}
            disabled={loading}
            style={{
              flex: 1,
              padding: '10px',
              background: '#f8fafc',
              color: '#64748b',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (otpRequired) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          padding: '24px',
          background: '#f0f9ff',
          borderRadius: '16px',
          border: '2px solid #3b82f6',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.2rem' }}>🔐</span>
          <h4 style={{ fontSize: '1rem', fontWeight: 900, color: '#1e40af', margin: 0 }}>
            Two-Factor Required
          </h4>
        </div>
        <p style={{ fontSize: '0.85rem', color: '#1e40af', fontWeight: 600, margin: 0 }}>
          Enter the OTP sent to your registered Paystack device/email to finalize this transfer.
        </p>
        <input
          type="text"
          value={otpValue}
          onChange={(e) => setOtpValue(e.target.value)}
          placeholder="000000"
          maxLength={6}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '12px',
            border: '2px solid #3b82f6',
            fontSize: '1.5rem',
            fontWeight: 900,
            textAlign: 'center',
            letterSpacing: '0.5em',
            outline: 'none',
          }}
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => executeAction('finalize_otp')}
            disabled={loading}
            style={{
              flex: 2,
              padding: '14px',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.95rem',
            }}
          >
            {loading ? 'Verifying...' : 'Verify & Send Funds'}
          </button>
          <button
            onClick={() => {
              setOtpRequired(false);
              setOtpValue('');
            }}
            disabled={loading}
            style={{
              flex: 1,
              padding: '14px',
              background: '#fff',
              color: '#64748b',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        background: '#f8fafc',
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        flex: 1,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>Action Center</h4>
        {paystackBalance !== null && (
          <div style={{ textAlign: 'right' }}>
            <p
              style={{
                fontSize: '0.7rem',
                color: '#64748b',
                fontWeight: 800,
                textTransform: 'uppercase',
                marginBottom: '2px',
              }}
            >
              Paystack Wallet
            </p>
            <p
              style={{
                fontSize: '0.9rem',
                fontWeight: 900,
                color: paystackBalance > 0 ? '#10b981' : '#ef4444',
              }}
            >
              ₦{paystackBalance.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          flex: 1,
          justifyContent: 'center',
        }}
      >
        <button
          onClick={() => executeAction('completed', false)}
          disabled={loading}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '8px',
            border: 'none',
            background: '#0f172a',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Processing...' : 'Approve & Pay'}
        </button>

        <button
          onClick={() => executeAction('completed', true)}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            color: '#0f172a',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          Mark as Paid Manually
        </button>

        <button
          onClick={() => setIsRejecting(true)}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            background: 'transparent',
            color: '#ef4444',
            fontWeight: 600,
            fontSize: '0.95rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
            opacity: loading ? 0.7 : 1,
          }}
        >
          Reject Payout
        </button>
      </div>
    </div>
  );
}
