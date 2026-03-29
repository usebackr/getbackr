'use client';

import React, { useState } from 'react';

interface SpendLog {
  id: string;
  amount: string;
  description: string | null;
  entryDate: string;
}

export default function TransparencyLedger({ logs }: { logs: SpendLog[] }) {
  const [showAll, setShowAll] = useState(false);
  const displayedLogs = showAll ? logs : logs.slice(0, 5);

  if (logs.length === 0) {
    return (
      <div
        style={{
          padding: '32px',
          background: '#f8fafc',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          textAlign: 'center',
        }}
      >
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
          No withdrawals have been made yet.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {displayedLogs.map((log) => (
        <div
          key={log.id}
          style={{
            padding: '16px 20px',
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'nowrap'
            }}
          >
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
              {new Date(log.entryDate).toLocaleDateString(undefined, { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
            <span 
              className="ledger-amount"
              style={{ fontSize: '1rem', fontWeight: 800, color: '#ef4444' }}
            >
              -₦{Number(log.amount).toLocaleString()}
            </span>
          </div>
          <p 
            style={{ 
              color: '#0f172a', 
              fontSize: '0.85rem', 
              lineHeight: 1.5,
              fontWeight: 500
            }}
          >
            {log.description}
          </p>
        </div>
      ))}

      {logs.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          style={{
            marginTop: '8px',
            padding: '12px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            background: '#fff',
            color: '#475569',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          className="btn-hover-light"
        >
          {showAll ? 'Show Less' : `Show All (${logs.length})`}
        </button>
      )}

      <style jsx>{`
        @media (max-width: 640px) {
          .ledger-amount {
            font-size: 0.9rem !important;
          }
        }
      `}</style>
    </div>
  );
}
