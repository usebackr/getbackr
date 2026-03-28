'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email') || 'your email';
  const userId = searchParams.get('userId');
  const [verified, setVerified] = useState(false);
  const [status, setStatus] = useState('Waiting for confirmation...');

  useEffect(() => {
    if (!userId) return;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/auth/verify-status?userId=${userId}`);
        const data = await res.json();
        if (data.verified) {
          setVerified(true);
          setStatus('Email verified! Redirecting to dashboard...');
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
          return true;
        }
      } catch (err) {
        console.error('Failed to check verification status');
      }
      return false;
    };

    // Initial check
    checkStatus();

    // Poll every 3 seconds
    const interval = setInterval(async () => {
      const isVerified = await checkStatus();
      if (isVerified) {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [userId, router]);

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
        <div className="container">
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
        <div
          className="card"
          style={{ maxWidth: '540px', width: '100%', textAlign: 'center', padding: '64px 32px' }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              background: verified ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 122, 0, 0.1)',
              borderRadius: '99px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              margin: '0 auto 32px',
              transition: 'all 0.3s ease',
            }}
          >
            {verified ? '✅' : '📧'}
          </div>

          <h2 style={{ fontSize: '2rem', marginBottom: '16px', color: 'var(--accent-secondary)' }}>
            {verified ? 'Confirmed!' : 'Check your email'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '40px', lineHeight: 1.6 }}>
            {verified ? (
              'Your email has been successfully verified. Welcome home!'
            ) : (
              <>
                We've sent a verification link to{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.<br />
                Please click the link to confirm your account.
              </>
            )}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {!verified && (
              <button
                className="btn-primary"
                style={{ width: '100%', padding: '16px' }}
                onClick={() => window.open('https://mail.google.com', '_blank')}
              >
                Open Mail App
              </button>
            )}

            <p
              style={{
                fontSize: '0.9rem',
                color: verified ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontWeight: 600,
              }}
            >
              {status}
            </p>

            {!verified && (
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                Didn't receive the email?{' '}
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-primary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Resend Verification
                </button>
              </p>
            )}
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
      </div>
    </div>
  );
}
