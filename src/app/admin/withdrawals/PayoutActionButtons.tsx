'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PayoutActionButtons({ withdrawalId }: { withdrawalId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const executeAction = async (action: 'completed' | 'rejected') => {
    let reason = '';
    
    if (action === 'rejected') {
      const input = prompt(
        `Please state the reason for REJECTING this payout. (This will be emailed to the creator):`,
        'Insufficient verification / Invalid bank details'
      );
      if (!input || input.trim() === '') {
        alert('A rejection reason is strictly required to bounce funds.');
        return;
      }
      reason = input.trim();
    } else {
      if (
        !confirm(
          `Process bank transfer for this amount? This permanently closes the payout.`,
        )
      )
        return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/withdrawals/${withdrawalId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action, reason }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || `Failed to process payout`);

      router.refresh();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
      setLoading(false);
    }
  };

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
          onClick={() => executeAction('rejected')}
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
