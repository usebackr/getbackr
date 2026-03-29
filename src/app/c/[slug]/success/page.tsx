'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';

export default function ThankYouPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const reference = searchParams.get('reference');

  const [status, setStatus] = useState<'pending' | 'confirmed' | 'failed'>('pending');
  const [counter, setCounter] = useState(10);

  useEffect(() => {
    if (!reference) return;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/payments/check-status?reference=${reference}`);
        const data = await res.json();
        if (data.status === 'confirmed') {
          setStatus('confirmed');
          setCounter(0);
        }
      } catch (e) {
        console.error('Status check failed', e);
      }
    };

    const interval = setInterval(() => {
      if (status !== 'confirmed' && counter > 0) {
        checkStatus();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [reference, status, counter]);

  useEffect(() => {
    if (counter > 0 && status !== 'confirmed') {
      const timer = setTimeout(() => setCounter(counter - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [counter, status]);

  const BRAND_COLOR = '#10b981';

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: '#f8fafc',
      padding: '20px',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{ 
        maxWidth: '480px', 
        width: '100%', 
        background: '#ffffff', 
        borderRadius: '24px', 
        padding: '48px 32px', 
        textAlign: 'center',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '1px solid #e2e8f0'
      }}>
        {/* Animated Success Icon */}
        <div style={{ 
          width: '80px', 
          height: '80px', 
          background: status === 'confirmed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)', 
          borderRadius: '40px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 24px',
          color: status === 'confirmed' ? BRAND_COLOR : '#3b82f6'
        }}>
          {status === 'confirmed' ? (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <div style={{ animation: 'spin 1s linear infinite' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </div>
          )}
        </div>

        <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: '#0f172a', marginBottom: '12px' }}>
          {status === 'confirmed' ? 'Contribution Confirmed!' : 'Thank You!'}
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#475569', lineHeight: '1.6', marginBottom: '32px' }}>
          {status === 'confirmed' 
            ? "We've confirmed your payment. You're now officially a part of this project's journey!"
            : "Your contribution was received. We're just waiting for final confirmation from the bank..."
          }
        </p>

        {reference && (
          <div style={{ 
            background: '#f1f5f9', 
            padding: '12px', 
            borderRadius: '12px', 
            fontSize: '0.85rem', 
            color: '#64748b',
            marginBottom: '32px',
            fontFamily: 'monospace'
          }}>
            Ref: {reference}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <a
            href="/explore"
            style={{ 
              display: 'block', 
              padding: '16px', 
              background: BRAND_COLOR, 
              color: '#ffffff', 
              textDecoration: 'none', 
              borderRadius: '12px', 
              fontWeight: 700,
              fontSize: '1rem',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
            }}
          >
            Explore More Projects
          </a>
          <a
            href="/"
            style={{ 
              display: 'block', 
              padding: '16px', 
              background: '#ffffff', 
              color: '#0f172a', 
              textDecoration: 'none', 
              borderRadius: '12px', 
              fontWeight: 700,
              fontSize: '1rem',
              border: '1px solid #e2e8f0'
            }}
          >
            Go to Homepage
          </a>
        </div>

        <p style={{ marginTop: '32px', fontSize: '0.85rem', color: '#94a3b8' }}>
          Checking for final confirmation in {counter}s...
        </p>
      </div>
    </div>
  );
}
