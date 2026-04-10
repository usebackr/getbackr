'use client';

import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export function ReconcileButton() {
  const [reference, setReference] = useState('');
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const handleReconcile = async () => {
    const isTargeted = reference.trim().length > 0;
    const confirmMsg = isTargeted
      ? `Are you sure you want to audit specific reference: ${reference}?`
      : 'Are you sure you want to run a global manual reconciliation? This will check all pending payments against Paystack.';

    if (!confirm(confirmMsg)) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: reference.trim() || undefined }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({
          success: true,
          message: data.summary || 'Audit complete.',
          details: data.details,
        });
        // Clear reference on success
        if (isTargeted) setReference('');
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
      <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '400px' }}>
        <input
          type="text"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Paste Payment Reference (optional)"
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            fontSize: '0.9rem',
            outline: 'none',
          }}
        />
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
            whiteSpace: 'nowrap',
          }}
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Auditing...' : reference ? 'Audit Reference' : 'Trigger Global Audit'}
        </button>
      </div>

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
