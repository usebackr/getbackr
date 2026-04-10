'use client';

import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export function ReconcileButton() {
  const [reference, setReference] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const handleReconcile = async () => {
    const isTargeted = reference.trim().length > 0;
    const hasOverride = campaignId.trim().length > 0;
    
    const confirmMsg = isTargeted
      ? `Audit specific reference: ${reference}${hasOverride ? ` -> Link to Campaign: ${campaignId}` : ''}?`
      : 'Run a global manual reconciliation for all pending payments?';

    if (!confirm(confirmMsg)) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reference: reference.trim() || undefined,
          campaignId: campaignId.trim() || undefined
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({
          success: true,
          message: data.summary || 'Audit complete.',
          details: data.details,
        });
        // Clear inputs on success
        if (isTargeted) {
          setReference('');
          setCampaignId('');
        }
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '500px' }}>
        <input
          type="text"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Payment Reference (e.g. uf6013e3kc)"
          style={{
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            fontSize: '0.9rem',
            outline: 'none',
          }}
        />
        
        {reference && (
          <input
            type="text"
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            placeholder="Target Campaign ID (Optional Override)"
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              fontSize: '0.9rem',
              outline: 'none',
              animation: 'fadeIn 0.2s ease-in-out',
            }}
          />
        )}

        <button
          onClick={handleReconcile}
          disabled={loading}
          className="btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '12px 24px',
            background: loading ? '#94a3b8' : '#0f172a',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Processing...' : reference ? 'Audit Specific Reference' : 'Run Global Reconciliation'}
        </button>
      </div>

      {result && (
        <div
          style={{
            marginTop: '16px',
            padding: '16px',
            borderRadius: '12px',
            background: result.success && (result.details?.processed > 0 || !reference) ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${result.success && (result.details?.processed > 0 || !reference) ? '#10b981' : '#ef4444'}`,
            color: result.success && (result.details?.processed > 0 || !reference) ? '#15803d' : '#b91c1c',
            fontSize: '0.85rem',
            width: '100%',
            maxWidth: '500px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', fontWeight: 600 }}>
            {result.success && (result.details?.processed > 0 || !reference) ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {result.message}
          </div>
          
          {result.details?.errors?.length > 0 && (
            <div style={{ marginTop: '8px', fontSize: '0.8rem', opacity: 0.9 }}>
              <strong>Issues:</strong>
              <ul style={{ paddingLeft: '20px', marginTop: '4px' }}>
                {result.details.errors.map((err: string, i: number) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
