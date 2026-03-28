'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function KycActionButtons({ userId }: { userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [reason, setReason] = useState('');

  const executeAction = async (action: 'verify' | 'reject') => {
    if (action === 'reject' && !reason) {
      alert('Please provide a rejection reason so the creator knows what to fix.');
      return;
    }

    if (
      !confirm(`Are you absolutely sure you want to ${action.toUpperCase()} this user's identity?`)
    )
      return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/kyc/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || `Failed to ${action}`);

      // Successfully processed
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
      }}
    >
      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
        Action Center
      </h4>

      {!rejectMode ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={() => executeAction('verify')}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '8px',
              border: 'none',
              background: '#10b981',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Processing...' : 'Verify User Natively'}
          </button>

          <button
            onClick={() => setRejectMode(true)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '8px',
              border: '1px solid currentColor',
              background: 'transparent',
              color: '#ef4444',
              fontWeight: 800,
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
              opacity: loading ? 0.7 : 1,
            }}
          >
            Reject Submissions
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Type exactly why the document failed validation..."
            rows={3}
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              width: '100%',
              resize: 'vertical',
              fontSize: '0.95rem',
            }}
          ></textarea>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => executeAction('reject')}
              disabled={loading || !reason}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background: '#ef4444',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: loading || !reason ? 'not-allowed' : 'pointer',
                opacity: loading || !reason ? 0.5 : 1,
              }}
            >
              Submit Rejection
            </button>
            <button
              onClick={() => setRejectMode(false)}
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background: '#e2e8f0',
                color: '#475569',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
