'use client';

import React, { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to submit request');
      setMessage(data.message);
      setEmail('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-secondary)',
      }}
    >
      <nav
        style={{
          padding: '24px',
          borderBottom: '1px solid var(--glass-border)',
          background: '#ffffff',
        }}
      >
        <div className="container" style={{ display: 'flex', justifyContent: 'center' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <h2 className="text-gradient" style={{ fontSize: '1.8rem', fontWeight: 900 }}>
              Backr
            </h2>
          </a>
        </div>
      </nav>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
        }}
      >
        <div
          className="card"
          style={{
            maxWidth: '440px',
            width: '100%',
            background: '#ffffff',
            padding: '48px',
            boxShadow: '0 40px 100px rgba(15, 23, 42, 0.08)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '2rem', marginBottom: '8px', color: 'var(--accent-secondary)' }}>
              Reset Password
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Enter your email to receive a secure reset link.
            </p>
          </div>

          {message && (
            <div
              style={{
                padding: '16px',
                background: '#ecfdf5',
                color: '#059669',
                borderRadius: '12px',
                marginBottom: '24px',
                fontSize: '0.95rem',
                textAlign: 'center',
                border: '1px solid #a7f3d0',
              }}
            >
              {message}
            </div>
          )}

          {error && (
            <div
              style={{
                padding: '16px',
                background: '#fee2e2',
                color: '#dc2626',
                borderRadius: '12px',
                marginBottom: '24px',
                fontSize: '0.95rem',
                textAlign: 'center',
                border: '1px solid #fecaca',
              }}
            >
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                }}
              >
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@email.com"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '1px solid var(--glass-border)',
                  outline: 'none',
                  fontSize: '1rem',
                  transition: 'border 0.2s',
                }}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ marginTop: '8px', width: '100%', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Sending Link...' : 'Send Reset Link'}
            </button>
          </form>

          <div
            style={{
              marginTop: '32px',
              textAlign: 'center',
              fontSize: '0.95rem',
              color: 'var(--text-secondary)',
            }}
          >
            <a
              href="/login"
              style={{ color: 'var(--text-primary)', fontWeight: 600, textDecoration: 'none' }}
            >
              ← Back to Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
