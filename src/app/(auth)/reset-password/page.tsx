'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new link.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      setMessage('Password reset successful! Redirecting to login...');
      setTimeout(() => {
        router.push('/login?message=Password+has+been+reset+successfully');
      }, 2500);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
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
          Create New Password
        </h3>
        <p style={{ color: 'var(--text-secondary)' }}>Please enter your new secure password.</p>
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
            style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.95rem' }}
          >
            New Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            minLength={8}
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
            disabled={!token || !!message}
          />
        </div>

        <div>
          <label
            style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.95rem' }}
          >
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            minLength={8}
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
            disabled={!token || !!message}
          />
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={loading || !token || !!message}
          style={{
            marginTop: '8px',
            width: '100%',
            opacity: loading || !token || !!message ? 0.7 : 1,
          }}
        >
          {loading ? 'Securing Account...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
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
        <Suspense fallback={<div>Loading form...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
