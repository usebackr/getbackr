'use client';

import React, { useEffect, useState } from 'react';
import { Users, Download, Shield } from 'lucide-react';

interface Backer {
  id: string;
  amount: string;
  currency: string;
  anonymous: boolean;
  createdAt: string;
  backerEmail: string | null;
  backerName: string | null;
  referralSource: string | null;
}

export default function BackerListManager({ campaignId }: { campaignId: string }) {
  const [backers, setBackers] = useState<Backer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBackers = async () => {
      try {
        const res = await fetch(`/api/campaigns/${campaignId}/backers`);
        if (res.ok) {
          const data = await res.json();
          setBackers(data.backers || []);
        }
      } catch (err) {
        console.error('Failed to fetch backers', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBackers();
  }, [campaignId]);

  const exportToCSV = () => {
    if (backers.length === 0) return;

    const headers = ['Date', 'Name', 'Email', 'Amount', 'Currency', 'Anonymous', 'Referral Source'];
    const rows = backers.map((b) => [
      new Date(b.createdAt).toLocaleDateString(),
      b.anonymous ? 'Anonymous' : b.backerName || 'Unknown',
      b.backerEmail || 'No Email',
      b.amount,
      b.currency,
      b.anonymous ? 'Yes' : 'No',
      b.referralSource || 'Organic'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `campaign_${campaignId}_backers.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading backers...</div>;
  }

  return (
    <div style={{ background: '#fff', borderRadius: '32px', border: '1px solid #e2e8f0', padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>Backer List</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>A detailed record of everyone who has supported your campaign.</p>
        </div>
        
        {backers.length > 0 && (
          <button 
            onClick={exportToCSV}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '14px',
              background: '#f8fafc',
              color: '#0f172a',
              border: '1px solid #e2e8f0',
              fontWeight: 700,
              cursor: 'pointer',
              flexShrink: 0,
              whiteSpace: 'nowrap'
            }}
          >
            <Download size={18} /> Export CSV
          </button>
        )}
      </div>

      {backers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <p style={{ fontWeight: 600, fontSize: '1.1rem', color: '#64748b', marginBottom: '8px' }}>No backers yet.</p>
          <p style={{ fontSize: '0.9rem' }}>Share your campaign to attract your first supporters!</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
              <tr>
                <th style={{ padding: '16px 20px', fontWeight: 700, color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Backer</th>
                <th style={{ padding: '16px 20px', fontWeight: 700, color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                <th style={{ padding: '16px 20px', fontWeight: 700, color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {backers.map((backer, idx) => (
                <tr key={backer.id} style={{ borderBottom: idx === backers.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: backer.anonymous ? '#f1f5f9' : '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {backer.anonymous ? 
                          <Shield size={18} color="#94a3b8" /> : 
                          <span style={{ fontWeight: 800, color: '#059669', fontSize: '1.1rem' }}>{(backer.backerName || 'U')[0].toUpperCase()}</span>
                        }
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: 700, color: '#0f172a', margin: '0 0 2px 0', fontSize: '0.95rem' }}>
                          {backer.anonymous ? 'Anonymous Backer' : backer.backerName || 'Unknown User'}
                        </p>
                        <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {backer.anonymous ? 'Hidden for privacy' : backer.backerEmail || 'No email provided'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>
                    {new Date(backer.createdAt).toLocaleDateString(undefined, {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 800, color: '#059669', fontSize: '1.05rem' }}>
                    ₦{Number(backer.amount).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
