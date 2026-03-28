'use client';

import React, { useState } from 'react';

export default function CheckoutButton({ campaignId }: { campaignId: string }) {
  const [amount, setAmount] = useState(1000);
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const initiatePayment = async () => {
    if (amount < 100) {
      setError('Minimum contribution is ₦100');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create contribution checkout session
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, amount }),
      });
      const data = await res.json();

      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl; // Redirect to Paystack
      } else {
        setError(data.error || 'Failed to initialize payment');
      }
    } catch (err) {
      setError('Network error during checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {error && <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>{error}</p>}

      <div style={{ position: 'relative' }}>
        <span
          style={{
            position: 'absolute',
            left: '16px',
            top: '14px',
            color: 'var(--text-secondary)',
            fontWeight: 600,
          }}
        >
          ₦
        </span>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          min={100}
          style={{
            width: '100%',
            padding: '14px 16px 14px 32px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            fontSize: '1.1rem',
            fontWeight: 600,
          }}
        />
      </div>

      <button
        onClick={initiatePayment}
        disabled={loading}
        className="btn-primary"
        style={{ padding: '16px', fontSize: '1.1rem', width: '100%', opacity: loading ? 0.7 : 1 }}
      >
        {loading ? 'Processing...' : 'Back this Project'}
      </button>
    </div>
  );
}
