'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PayoutActionButtons({ withdrawalId }: { withdrawalId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const executeAction = async (action: 'completed' | 'expired') => {
    if (action === 'expired') {
      if (
        !confirm(
          `Are you sure you want to REJECT this payout and bounce funds back to their wallet?`,
        )
      )
        return;
    } else {
      if (
        !confirm(
          `Did you successfully process the bank transfer for this amount? This will permanently close the payout.`,
        )
      )
        return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/withdrawals/${withdrawalId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || `Failed to process payout`);

      router.refresh(); // Refresh state cleanly
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
          {loading ? 'Processing...' : 'Mark as Paid'}
        </button>

        <button
          onClick={() => executeAction('expired')}
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
          Reject / Bounce Back
        </button>
      </div>
    </div>
  );
}
