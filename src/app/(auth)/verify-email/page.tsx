'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Mail, CheckCircle2, AlertTriangle } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email') || 'your email';
  const token = searchParams.get('token');
  const userId = searchParams.get('userId');

  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Automatic Verification if token is present
  useEffect(() => {
    if (!token) {
      if (!userId) {
        setLoading(false);
      }
      return;
    }

    const performVerification = async () => {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (res.ok) {
          setVerified(true);
        } else {
          setError(data.errors?.[0]?.message || 'Verification failed. The link may be expired.');
        }
      } catch (err) {
        setError('Failed to connect to the server. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    performVerification();
  }, [token, userId]);

  // 2. Legacy Polling for "Check your email" tab that stayed open
  useEffect(() => {
    if (verified || token || !userId) return;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/auth/verify-status?userId=${userId}`);
        const data = await res.json();
        if (data.verified) {
          setVerified(true);
          setLoading(false);
          return true;
        }
      } catch (err) {
        console.error('Failed to check verification status');
      }
      return false;
    };

    checkStatus();
    const interval = setInterval(async () => {
      const isVerified = await checkStatus();
      if (isVerified) {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [userId, token, verified]);

  if (loading) {
    return (
      <div
        className="card"
        style={{ maxWidth: '500px', width: '100%', padding: '64px', textAlign: 'center' }}
      >
        <div className="animate-pulse">
          <div
            style={{
              width: '64px',
              height: '64px',
              background: '#f1f5f9',
              borderRadius: '50%',
              margin: '0 auto 24px',
            }}
          ></div>
          <h3 style={{ color: 'var(--text-secondary)' }}>Verifying your account...</h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="card"
        style={{ maxWidth: '500px', width: '100%', padding: '64px', textAlign: 'center' }}
      >
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
          <AlertTriangle size={64} className="text-amber-500" />
        </div>
        <h2 style={{ color: 'var(--accent-secondary)', marginBottom: '16px' }}>
          Verification Error
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>{error}</p>
        <button
          className="btn-secondary"
          style={{ width: '100%' }}
          onClick={() => router.push('/signup')}
        >
          Back to Signup
        </button>
      </div>
    );
  }

  if (verified) {
    return (
      <div
        className="card"
        style={{
          maxWidth: '540px',
          width: '100%',
          textAlign: 'center',
          padding: '80px 48px',
          background: '#ffffff',
          boxShadow: '0 40px 100px rgba(15, 23, 42, 0.05)',
        }}
      >
        <div
          style={{
            width: '100px',
            height: '100px',
            background: '#f0fdf4',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 40px',
            animation: 'scaleIn 0.5s ease-out',
          }}
        >
          <CheckCircle2 size={56} color="#10b981" strokeWidth={1.5} />
        </div>

        <h2
          style={{
            fontSize: '2.5rem',
            fontWeight: 900,
            marginBottom: '16px',
            color: 'var(--accent-secondary)',
          }}
        >
          Email <span className="text-gradient">Verified</span>!
        </h2>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '1.1rem',
            marginBottom: '48px',
            lineHeight: 1.6,
          }}
        >
          Thank you! Your account is now fully active. You&apos;re ready to start your journey with
          Backr.
        </p>

    const from = searchParams.get('from');

    return (
      <div
        className="card"
        style={{
          maxWidth: '540px',
          width: '100%',
          textAlign: 'center',
          padding: '80px 48px',
          background: '#ffffff',
          boxShadow: '0 40px 100px rgba(15, 23, 42, 0.05)',
        }}
      >
        <div
          style={{
            width: '100px',
            height: '100px',
            background: '#f0fdf4',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 40px',
            animation: 'scaleIn 0.5s ease-out',
          }}
        >
          <CheckCircle2 size={56} color="#10b981" strokeWidth={1.5} />
        </div>

        <h2
          style={{
            fontSize: '2.5rem',
            fontWeight: 900,
            marginBottom: '16px',
            color: 'var(--accent-secondary)',
          }}
        >
          Email <span className="text-gradient">Verified</span>!
        </h2>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '1.1rem',
            marginBottom: '48px',
            lineHeight: 1.6,
          }}
        >
          Thank you! Your account is now fully active. You&apos;re ready to start your journey with
          Backr.
        </p>

        <button
          className="btn-primary"
          style={{ width: '100%', padding: '18px', fontSize: '1rem', fontWeight: 700 }}
          onClick={() => router.push(`/login${from ? `?from=${encodeURIComponent(from)}` : ''}`)}
        >
          Continue to {from ? 'Complete Support' : 'Login'}
        </button>
      </div>
    );
  }

  return (
    <div
      className="card"
      style={{ maxWidth: '540px', width: '100%', textAlign: 'center', padding: '64px 32px' }}
    >
      <div
        style={{
          width: '80px',
          height: '80px',
          background: 'rgba(255, 122, 0, 0.1)',
          borderRadius: '99px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 32px',
        }}
      >
        <Mail size={40} color="#f97316" strokeWidth={1.5} />
      </div>

      <h2 style={{ fontSize: '2rem', marginBottom: '16px', color: 'var(--accent-secondary)' }}>
        Check your email
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '40px', lineHeight: 1.6 }}>
        We&apos;ve sent a verification link to{' '}
        <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.<br />
        Please click the link to confirm your account.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <button
          className="btn-primary"
          style={{ width: '100%', padding: '16px' }}
          onClick={() => window.open('https://mail.google.com', '_blank')}
        >
          Open Mail App
        </button>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '24px' }}>
          Waiting for confirmation...
        </p>
      </div>

      <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid #f1f5f9' }}>
        <a
          href="/login"
          style={{
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          ← Return to Login
        </a>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#f8fafc',
      }}
    >
      <nav style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
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
          padding: '24px',
        }}
      >
        <Suspense fallback={<div>Determining verification status...</div>}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
