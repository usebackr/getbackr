'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface UserProfile {
  kycStatus: 'unsubmitted' | 'pending' | 'verified' | 'rejected';
  kycRejectionReason?: string | null;
  isBeta?: boolean;
  emailVerified?: boolean;
}

export function VerificationBanner({ user }: { user: UserProfile }) {
  const router = useRouter();
  const [resending, setResending] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const handleResend = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setResending(true);
    try {
      const res = await fetch('/api/auth/resend-verification', { method: 'POST' });
      if (res.ok) setSent(true);
    } catch (err) {
      console.error('Failed to resend verification');
    } finally {
      setResending(false);
    }
  };

  // 1. Email Verification Priority
  if (!user.emailVerified) {
    return (
      <div
        style={{
          padding: '24px 32px',
          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
          border: '1px solid #bfdbfe',
          borderRadius: '24px',
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
          flexWrap: 'wrap',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div style={{ flex: '1 1 400px' }}>
          <h4
            style={{
              fontSize: '1.1rem',
              fontWeight: 800,
              color: '#1e40af',
              marginBottom: '4px',
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            Confirm Your Email Address
          </h4>
          <p
            style={{
              fontSize: '0.9rem',
              color: '#1e40af',
              opacity: 0.8,
              fontWeight: 500,
              lineHeight: 1.5,
            }}
          >
            Please verify your email to secure your account and access all features. Check your
            inbox for the link.
          </p>
        </div>
        <button
          onClick={handleResend}
          disabled={resending || sent}
          style={{
            padding: '12px 24px',
            background: sent ? '#10b981' : '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: sent ? 'default' : 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
            opacity: resending ? 0.7 : 1,
          }}
        >
          {resending ? 'Sending...' : sent ? '✓ Link Sent' : 'Resend Verification Link'}
        </button>
      </div>
    );
  }

  if (user.kycStatus === 'verified') return null;

  const getStatusContent = () => {
    switch (user.kycStatus) {
      case 'unsubmitted':
        return {
          title: 'Unlock Payouts & Full Features',
          message:
            'Complete your identity verification to start receiving funds and launch verified projects.',
          btnText: 'Verify Identity Now',
          bg: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          border: '1px solid #e2e8f0',
          color: '#0f172a',
          btnBg: '#10b981', // Branded green for positive action
        };
      case 'pending':
        return {
          title: 'Verification Under Review',
          message:
            'We are reviewing your documents. You’ll be notified once your account is fully verified (usually within 24-48h).',
          btnText: 'View Status',
          bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
          border: '1px solid #fde68a',
          color: '#92400e',
          btnBg: '#d97706',
        };
      case 'rejected':
        return {
          title: 'Action Required: Verification Rejected',
          message:
            user.kycRejectionReason ||
            'There was an issue with your documents. Please review and re-submit.',
          btnText: 'Fix Verification',
          bg: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
          border: '1px solid #fecaca',
          color: '#991b1b',
          btnBg: '#dc2626',
        };
      default:
        return null;
    }
  };

  const content = getStatusContent();
  if (!content) return null;

  return (
    <div
      style={{
        padding: '24px 32px',
        background: content.bg,
        border: content.border,
        borderRadius: '24px',
        marginBottom: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px',
        flexWrap: 'wrap',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div style={{ flex: '1 1 400px' }}>
        <h4
          style={{
            fontSize: '1.1rem',
            fontWeight: 800,
            color: content.color,
            marginBottom: '4px',
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          {content.title}
        </h4>
        <p
          style={{
            fontSize: '0.9rem',
            color: content.color,
            opacity: 0.8,
            fontWeight: 500,
            lineHeight: 1.5,
          }}
        >
          {content.message}
        </p>
      </div>
      <button
        onClick={() => router.push('/dashboard/identity')}
        style={{
          padding: '12px 24px',
          background: content.btnBg,
          color: '#fff',
          border: 'none',
          borderRadius: '12px',
          fontWeight: 700,
          fontSize: '0.9rem',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'transform 0.2s',
        }}
        onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
        onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
      >
        {content.btnText}
      </button>
    </div>
  );
}

export function OnboardingChecklist({
  user,
  hasCampaigns,
  hasBank,
}: {
  user: UserProfile;
  hasCampaigns: boolean;
  hasBank: boolean;
}) {
  const router = useRouter();

  // Only show if user has no campaigns yet
  if (hasCampaigns) return null;

  const steps = [
    {
      id: 'kyc',
      number: '1',
      title: 'Verify Your Identity',
      desc: 'Unlock full platform access by submitting your ID.',
      completed: user.kycStatus === 'verified',
      path: '/dashboard/identity',
    },
    {
      id: 'bank',
      number: '2',
      title: 'Add Bank Account',
      desc: 'Set up where you’ll receive your project funds.',
      completed: hasBank,
      path: '/dashboard/settings',
    },
    {
      id: 'campaign',
      number: '3',
      title: 'Start Your First Campaign',
      desc: 'Launch your creative dream and start raising support.',
      completed: false,
      path: '/dashboard/campaigns/create',
    },
    {
      id: 'explore',
      number: '4',
      title: 'Explore Projects',
      desc: 'Find and support creative ventures across the platform.',
      completed: false,
      path: '/explore',
    },
  ];

  return (
    <div style={{ marginBottom: '48px' }}>
      <h3
        style={{
          fontSize: '1.25rem',
          fontWeight: 800,
          fontFamily: "'Outfit', sans-serif",
          marginBottom: '20px',
          color: '#0f172a',
        }}
      >
        Getting Started
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
        }}
      >
        {steps.map((step) => (
          <div
            key={step.id}
            onClick={() => router.push(step.path)}
            style={{
              padding: '24px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '20px',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              opacity: step.completed ? 0.7 : 1,
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = '#10b981';
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.05)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: step.completed ? '#10b981' : '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem',
                fontWeight: 800,
                color: step.completed ? '#ffffff' : '#475569',
                marginBottom: '16px',
                transition: 'all 0.2s',
              }}
            >
              {step.completed ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                step.number
              )}
            </div>
            <h5
              style={{
                fontSize: '1rem',
                fontWeight: 800,
                color: '#0f172a',
                marginBottom: '6px',
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              {step.title}
            </h5>
            <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>{step.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
