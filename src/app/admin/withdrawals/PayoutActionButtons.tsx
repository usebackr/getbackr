'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PayoutActionButtons({ withdrawalId }: { withdrawalId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [reason, setReason] = useState('Insufficient verification / Invalid bank details');

  const executeAction = async (action: 'completed' | 'rejected') => {
    if (action === 'completed') {
      if (!confirm(`Process bank transfer for this amount? This permanently closes the payout.`)) {
        return;
      }
    } else {
      if (!reason || reason.trim() === '') {
        alert('A rejection reason is strictly required to bounce funds.');
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/withdrawals/${withdrawalId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action, reason: action === 'rejected' ? reason.trim() : '' }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || `Failed to process payout`);

      router.refresh();
      setIsRejecting(false);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
      setLoading(false);
    }
  };

  if (isRejecting) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', background: '#fff1f2', borderRadius: '12px', border: '1px solid #fecaca' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#991b1b', textTransform: 'uppercase' }}>Rejection Feedback</h4>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why this request is being rejected..."
          style={{ width: '100%', height: '80px', padding: '12px', borderRadius: '8px', border: '1px solid #fecaca', fontSize: '0.9rem', outline: 'none', resize: 'none' }}
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => executeAction('rejected')}
            disabled={loading}
            style={{ flex: 2, padding: '10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}
          >
            {loading ? 'Processing...' : 'Confirm Reject'}
          </button>
          <button
            onClick={() => setIsRejecting(false)}
            disabled={loading}
            style={{ flex: 1, padding: '10px', background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}
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
      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
        Action Center
      </h4>

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
          onClick={() => executeAction('completed')}
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
          onClick={() => setIsRejecting(true)}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid currentColor',
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
