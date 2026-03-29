'use client';

import React, { useState } from 'react';

export default function CheckoutForm({
  campaignId,
  goalAmount,
  raisedAmount,
}: {
  campaignId: string;
  goalAmount: number;
  raisedAmount: number;
}) {
  const [amount, setAmount] = useState<number | ''>('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);

  const currentPct = Math.floor(Math.min((raisedAmount / goalAmount) * 100, 100));
  const inputAmt = Number(amount) || 0;
  const projectedPct = Math.floor(Math.min((inputAmt / goalAmount) * 100, 100 - currentPct));
  const presetAmounts = [1000, 5000, 10000, 20000, 50000, 100000, 200000, 500000];

  const initiatePayment = async () => {
    if (!amount || amount < 100) {
      setError('Minimum contribution is ₦100');
      return;
    }
    if (!email) {
      setError('Email address is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          campaignId, 
          amount,
          email,
          name
        }), 
      });
      const data = await res.json();

      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
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
    <div
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '32px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <a
          href="/explore"
          style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </a>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
          Fund Campaign
        </h3>
      </div>

      {/* Progress Stats */}
      <div style={{ marginBottom: '32px' }}>
        <p style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 600, marginBottom: '8px' }}>
          Target ₦{raisedAmount.toLocaleString()} /{' '}
          <span style={{ color: '#94a3b8', fontWeight: 500 }}>₦{goalAmount.toLocaleString()}</span>
        </p>
        <div
          style={{
            width: '100%',
            height: '6px',
            background: '#f1f5f9',
            borderRadius: '3px',
            marginBottom: '8px',
            overflow: 'hidden',
            display: 'flex',
          }}
        >
          <div
            style={{
              width: `${currentPct}%`,
              height: '100%',
              background: 'var(--accent-primary)',
              transition: 'width 0.3s ease',
            }}
          ></div>
          {projectedPct > 0 && (
            <div
              style={{
                width: `${projectedPct}%`,
                height: '100%',
                background: 'var(--accent-primary)',
                opacity: 0.4,
                transition: 'width 0.3s ease',
              }}
            ></div>
          )}
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '12px',
            background: '#fef2f2',
            color: '#ef4444',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '0.85rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Preset Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        {presetAmounts.map((amt, i) => (
          <button
            key={i}
            onClick={() => setAmount(amt)}
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: amount === amt ? '2px solid var(--accent-primary)' : '1px solid #e2e8f0',
              background: amount === amt ? 'rgba(16, 185, 129, 0.05)' : '#ffffff',
              color: amount === amt ? 'var(--accent-primary)' : '#475569',
              fontWeight: 600,
              fontSize: '1rem',
              fontFamily: 'Outfit, sans-serif',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            ₦{amt.toLocaleString()}
          </button>
        ))}
      </div>

      {/* Form Fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
        <div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.85rem',
              color: '#475569',
              marginBottom: '12px',
              position: 'relative'
            }}
          >
            Your Contribution 
            <div 
              style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <div 
                style={{ 
                  width: '18px', 
                  height: '18px', 
                  borderRadius: '50%', 
                  background: '#f1f5f9', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: '#64748b',
                  border: '1px solid #e2e8f0'
                }}
              >
                i
              </div>
              {showTooltip && (
                <div 
                  style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 12px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#0f172a',
                    color: '#fff',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    width: '220px',
                    zIndex: 50,
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
                    textAlign: 'center',
                    pointerEvents: 'none',
                    fontWeight: 500,
                    lineHeight: 1.5
                  }}
                >
                  <p style={{ margin: 0 }}>
                    A <span style={{ color: '#10b981', fontWeight: 800 }}>1.5% processing fee</span> will be deducted from your donation to cover payment gateway costs.
                  </p>
                  <div 
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      borderWidth: '6px',
                      borderStyle: 'solid',
                      borderColor: '#0f172a transparent transparent transparent'
                    }}
                  />
                </div>
              )}
            </div>
          </label>
          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: '16px',
                top: '14px',
                color: '#0f172a',
                fontWeight: 600,
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              ₦
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || '')}
              style={{
                width: '100%',
                padding: '14px 16px 14px 32px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '1rem',
                fontWeight: 600,
                color: '#0f172a',
                fontFamily: 'Outfit, sans-serif',
              }}
            />
          </div>
        </div>

        <div>
          <label
            style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '8px' }}
          >
            Your full name *
          </label>
          <input
            type="text"
            placeholder="Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '0.9rem',
            }}
          />
        </div>

        <div>
          <label
            style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '8px' }}
          >
            Email address *
          </label>
          <input
            type="email"
            placeholder="example@backr.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '0.9rem',
            }}
          />
        </div>

        <div>
          <label
            style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '8px' }}
          >
            Add a word of support for the organizer <span style={{ fontSize: '1.2rem' }}>🇳🇬</span>{' '}
            (Optional)
          </label>
          <textarea
            placeholder="Cheer them on..."
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '0.9rem',
              resize: 'vertical',
            }}
          />
        </div>
      </div>

      {/* Checkboxes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.85rem',
            color: '#475569',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
          />
          Make my contribution anonymous.
        </label>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.85rem',
            color: '#475569',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
          />
          Securely share my contact details with the organizer.
        </label>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.85rem',
            color: '#475569',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
          />
          Send me project updates and Backr news (opt out anytime).
        </label>
      </div>

      {/* Submit Button */}
      <button
        onClick={initiatePayment}
        disabled={loading}
        className="btn-primary"
        style={{
          width: '100%',
          padding: '18px',
          fontSize: '1.1rem',
          borderRadius: '8px',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Processing...' : 'Support This Project'}
      </button>
    </div>
  );
}
