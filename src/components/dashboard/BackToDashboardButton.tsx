'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function BackToDashboardButton({
  style,
  to = '/dashboard',
  label = 'Dashboard',
}: {
  style?: React.CSSProperties;
  to?: string;
  label?: string;
}) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(to)}
      onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
      onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
      style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        color: '#0f172a',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontWeight: 700,
        padding: '8px 16px',
        fontSize: '0.86rem',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        transition: 'all 0.2s',
        width: 'fit-content',
        marginBottom: '24px',
        ...style,
      }}
    >
      <ArrowLeft size={16} strokeWidth={2.5} />
      {label}
    </button>
  );
}
