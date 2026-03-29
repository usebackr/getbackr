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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {displayedLogs.map((log) => (
        <div
          key={log.id}
          className="ledger-row"
          style={{
            padding: '12px 16px',
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, whiteSpace: 'nowrap' }}>
              {new Date(log.entryDate).toLocaleDateString(undefined, { 
                month: 'short', 
                day: 'numeric'
              })}
              <span style={{ marginLeft: '4px', opacity: 0.7 }}>
                {new Date(log.entryDate).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </span>
            </span>
            <p 
              style={{ 
                color: '#475569', 
                fontSize: '0.8rem', 
                fontWeight: 600,
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {log.description}
            </p>
          </div>
          <span 
            style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ef4444', whiteSpace: 'nowrap' }}
          >
            -₦{Number(log.amount).toLocaleString()}
          </span>
        </div>
      ))}

      {logs.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          style={{
            marginTop: '4px',
            padding: '10px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            background: '#fff',
            color: '#64748b',
            fontSize: '0.8rem',
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
          .ledger-row {
            padding: 8px 12px !important;
          }
          .ledger-row p {
            font-size: 0.75rem !important;
          }
        }
      `}</style>
    </div>
  );
}
