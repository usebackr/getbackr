'use client';

import React, { useState } from 'react';

import { Receipt, ExternalLink } from 'lucide-react';

interface SpendLog {
  id: string;
  amount: string;
  description: string | null;
  entryDate: string;
  receiptUrl?: string | null;
}

export default function TransparencyLedger({ logs }: { logs: SpendLog[] }) {
  const [showAll, setShowAll] = useState(false);
  const displayedLogs = showAll ? logs : logs.slice(0, 5);

  if (logs.length === 0) {
    return (
      <div
        style={{
          padding: '40px',
          background: '#f8fafc',
          borderRadius: '20px',
          border: '1px dashed #e2e8f0',
          textAlign: 'center',
        }}
      >
        <Receipt size={40} style={{ margin: '0 auto 16px', color: '#cbd5e1' }} />
        <p style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: 600 }}>No expenditure recorded yet.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {displayedLogs.map((log) => (
        <div
          key={log.id}
          style={{
            padding: '16px',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            transition: 'all 0.2s',
          }}
          className="ledger-row-hover"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
            <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '10px' }}>
              <Receipt size={20} color="#64748b" />
            </div>
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  color: '#0f172a',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  margin: '0 0 2px 0',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {log.description}
              </p>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  fontWeight: 600,
                }}
              >
                {new Date(log.entryDate).toLocaleDateString(undefined, {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {log.receiptUrl && (
              <a 
                href={log.receiptUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                title="View Receipt"
                style={{ 
                  color: '#64748b',
                  background: '#f1f5f9',
                  padding: '6px',
                  borderRadius: '8px',
                  display: 'flex'
                }}
              >
                <ExternalLink size={16} />
              </a>
            )}
            <span
              style={{ fontSize: '1rem', fontWeight: 900, color: '#ef4444' }}
            >
              -₦{Number(log.amount).toLocaleString()}
            </span>
          </div>
        </div>
      ))}

      {logs.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          style={{
            marginTop: '8px',
            padding: '12px',
            borderRadius: '14px',
            border: '1px solid #f1f5f9',
            background: '#fff',
            color: '#64748b',
            fontSize: '0.85rem',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {showAll ? 'Show Less' : `View All ${logs.length} Entries`}
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
