'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function PendingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const from = searchParams.get('from');
  const email = searchParams.get('email') || 'your email';
  const loginUrl = `/login${from ? `?from=${encodeURIComponent(from)}` : ''}`;

  return (
    <div
      className="card"
      style={{
        maxWidth: '500px',
        width: '100%',
        background: '#ffffff',
        padding: '60px 40px',
        textAlign: 'center',
        boxShadow: '0 40px 100px rgba(15, 23, 42, 0.05)',
      }}
    >
      <div
        style={{
          width: '80px',
          height: '80px',
          background: '#f0fdf4',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 32px',
        }}
      >
        <span style={{ fontSize: '40px' }}>✉️</span>
      </div>

      <h2
        style={{
          fontSize: '2rem',
          fontWeight: 900,
          color: 'var(--accent-secondary)',
          marginBottom: '16px',
        }}
      >
        Check your <span className="text-gradient">inbox</span>!
      </h2>

      <p
        style={{
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          marginBottom: '32px',
          fontSize: '1.05rem',
        }}
      >
        We&apos;ve sent a verification link to <strong>{email}</strong>. Please click the link in
        the email to activate your account.
      </p>

      <div
        style={{
          background: '#f8fafc',
          padding: '24px',
          borderRadius: '16px',
          marginBottom: '32px',
          textAlign: 'left',
          fontSize: '0.9rem',
          color: '#64748b',
        }}
      >
        <p style={{ fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
          Didn&apos;t receive the email?
        </p>
        <ul style={{ paddingLeft: '20px', margin: 0 }}>
          <li>Check your spam or junk folder.</li>
          <li>Wait a minute and refresh your inbox.</li>
          <li>Make sure you entered your email correctly.</li>
        </ul>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <button
          onClick={() => router.push(loginUrl)}
          className="btn-primary"
          style={{ width: '100%', padding: '16px' }}
        >
          Verification complete? Go to Login
        </button>
        <a
          href={loginUrl}
          style={{
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          Return to Login
        </a>
      </div>
    </div>
  );
}

export default function VerificationPendingPage() {
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
        <Suspense fallback={<div>Loading verification status...</div>}>
          <PendingContent />
        </Suspense>
      </div>
    </div>
  );
}
