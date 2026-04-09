'use client';

import React from 'react';
import { Receipt, Plus, Trash2, Calendar, DollarSign, ExternalLink } from 'lucide-react';

interface SpendingLog {
  id: string;
  description: string;
  amount: string;
  entryDate: string;
  receiptUrl: string | null;
  createdAt: string;
}

interface SpendingLogManagerProps {
  campaignId: string;
}

export default function SpendingLogManager({ campaignId }: SpendingLogManagerProps) {
  const [logs, setLogs] = React.useState<SpendingLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  // Form state
  const [description, setDescription] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [entryDate, setEntryDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [receiptUrl, setReceiptUrl] = React.useState('');

  React.useEffect(() => {
    fetchLogs();
  }, [campaignId]);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/spending`);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/spending`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          amount,
          entryDate,
          receiptUrl: receiptUrl || undefined,
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setDescription('');
        setAmount('');
        setReceiptUrl('');
        fetchLogs();
      }
    } catch (error) {
      console.error('Failed to add log:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading spending logs...</div>;
  }

  return (
    <div style={{ background: '#fff', borderRadius: '32px', border: '1px solid #e2e8f0', padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>Spending Log</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Record your project expenditures for transparency</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '14px',
              background: 'var(--accent-primary)',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Plus size={18} /> Add Log Entry
          </button>
        )}
      </div>

      {showForm && (
        <form 
          onSubmit={handleSubmit}
          style={{ 
            background: '#f8fafc', 
            padding: '24px', 
            borderRadius: '24px', 
            border: '1px solid #e2e8f0',
            marginBottom: '32px'
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Description</label>
              <input 
                required
                placeholder="e.g., Purchased professional cinema camera kit"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Amount (₦)</label>
              <input 
                required
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Date</label>
              <input 
                required
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Receipt/Proof URL (Optional)</label>
              <input 
                type="url"
                placeholder="Link to image, document, or tweet"
                value={receiptUrl}
                onChange={(e) => setReceiptUrl(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifySelf: 'flex-end', gap: '12px' }}>
            <button 
              type="button" 
              onClick={() => setShowForm(false)} 
              style={{ padding: '10px 20px', borderRadius: '12px', background: 'none', border: '1px solid #e2e8f0', fontWeight: 700, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button 
              disabled={submitting}
              style={{ 
                padding: '10px 24px', 
                borderRadius: '12px', 
                background: '#0f172a', 
                color: '#fff', 
                border: 'none', 
                fontWeight: 700, 
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1
              }}
            >
              {submitting ? 'Adding...' : 'Save Log Entry'}
            </button>
          </div>
        </form>
      )}

      {logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <Receipt size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <p style={{ fontWeight: 600 }}>No spending logs yet.</p>
          <p style={{ fontSize: '0.85rem' }}>Start by adding your first project expense.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {logs.map((log) => (
            <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '16px', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
              <div style={{ width: '48px', height: '48px', background: '#f8fafc', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                <Receipt size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '2px' }}>{log.description}</h4>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: '#64748b' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {new Date(log.entryDate).toLocaleDateString()}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#10b981' }}><DollarSign size={14} /> ₦{parseFloat(log.amount).toLocaleString()}</span>
                </div>
              </div>
              {log.receiptUrl && (
                <a 
                  href={log.receiptUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ 
                    padding: '8px 16px', 
                    borderRadius: '10px', 
                    background: '#f1f5f9', 
                    color: '#0f172a', 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <ExternalLink size={14} /> Receipt
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
