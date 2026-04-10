'use client';

import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export function ReconcileButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const handleReconcile = async () => {
    if (!confirm('Are you sure you want to run a manual reconciliation? This will check all pending payments against Paystack.')) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/reconcile', {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok) {
        setResult({
          success: true,
          message: data.summary || 'Audit complete.',
          details: data.details,
        });
        // Optional: Refresh page to update counts after short delay
        setTimeout(() => window.location.reload(), 3000);
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to trigger reconciliation.',
        });
      }
    } catch (err: any) {
      setResult({
        success: false,
        message: 'Network error occurred.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
      <button
        onClick={handleReconcile}
        disabled={loading}
        className="btn-primary"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 24px',
          background: loading ? '#94a3b8' : '#0f172a',
          fontSize: '0.9rem',
          fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        {loading ? 'Auditing Reality...' : 'Trigger Manual Audit'}
      </button>

      {result && (
        <div
          style={{
            marginTop: '12px',
            padding: '8px 12px',
            borderRadius: '8px',
            background: result.success ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${result.success ? '#10b981' : '#ef4444'}`,
            color: result.success ? '#15803d' : '#b91c1c',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.3s ease-in-out',
          }}
        >
          {result.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {result.message}
        </div>
      )}
    </div>
  );
}
