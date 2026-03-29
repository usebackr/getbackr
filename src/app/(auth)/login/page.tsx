'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const [showPassword, setShowPassword] = React.useState(false);

  const message = searchParams.get('message');
  const registered = searchParams.get('registered');
  const sessionError = searchParams.get('error');

  React.useEffect(() => {
    if (sessionError === 'session_expired') {
      setError('Your session has expired. Please log in again.');
    }
  }, [sessionError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid email or password');
        return;
      }

      // Login successful
      const from = searchParams.get('from') || '/dashboard';
      router.replace(from);
    } catch (err) {
      setError('Failed to connect to the server');
    } finally {
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
          Welcome Back
        </h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          Log in to continue your creative journey.
        </p>
      </div>

      {(message || registered) && !error && (
        <div
          style={{
            padding: '14px 16px',
            background: '#ecfdf5',
            color: '#065f46',
            borderRadius: '10px',
            marginBottom: '24px',
            fontSize: '0.9rem',
            textAlign: 'center',
            border: '1px solid #a7f3d0',
            lineHeight: 1.5,
          }}
        >
          {registered ? (
            <>
              ✅ Account created! We sent you a welcome email.<br />
              <span style={{ fontSize: '0.82rem', color: '#047857' }}>Can't find it? Check your <strong>spam / junk folder</strong>.</span>
            </>
          ) : message}
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '12px',
            background: '#fee2e2',
            color: '#dc2626',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '0.9rem',
            textAlign: 'center',
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
              fontSize: '0.9rem',
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
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid var(--glass-border)',
              outline: 'none',
              fontSize: '1rem',
            }}
            required
          />
        </div>
        <div>
          <div
            style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}
          >
            <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Password</label>
            <a
              href="/forgot-password"
              style={{
                fontSize: '0.8rem',
                color: 'var(--accent-primary)',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Forgot password?
            </a>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '12px 48px 12px 16px',
                borderRadius: '12px',
                border: '1px solid var(--glass-border)',
                outline: 'none',
                fontSize: '1rem',
              }}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94a3b8',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
          style={{ marginTop: '12px', width: '100%', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Logging In...' : 'Log In'}
        </button>
      </form>

      <div
        style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '0.9rem',
          color: 'var(--text-secondary)',
        }}
      >
        Don't have an account?{' '}
        <a
          href="/signup"
          style={{ color: 'var(--accent-primary)', fontWeight: 700, textDecoration: 'none' }}
        >
          Sign Up
        </a>
      </div>
    </div>
  );
}

export default function LoginPage() {
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
        <Suspense fallback={<div>Loading login...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
