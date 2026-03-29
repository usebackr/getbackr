'use client';

import React from 'react';

interface Backer {
  id: string;
  backerName: string | null;
  amount: string;
  isAnonymous: boolean | null;
  createdAt: Date;
}

export default function BackersList({ 
  backers, 
  totalDonors 
}: { 
  backers: Backer[]; 
  totalDonors: number 
}) {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
          Latest Backers
        </h4>
        <span
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            background: '#f8fafc',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--accent-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          {totalDonors} TOTAL
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {backers.length === 0 ? (
          <p
            style={{
              color: '#475569',
              fontSize: '0.9rem',
              textAlign: 'center',
              padding: '16px 0',
            }}
          >
            Be the first to back this project!
          </p>
        ) : (
          backers.slice(0, 10).map((backer) => (
            <div 
              key={backer.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '16px',
                borderBottom: '1px solid #f1f5f9'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <p style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                  {backer.isAnonymous ? 'Anonymous Supporter' : (backer.backerName || 'Anonymous Supporter')}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {new Date(backer.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <p style={{ fontWeight: 800, color: 'var(--accent-primary)', fontSize: '1rem' }}>
                ₦{Number(backer.amount).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
