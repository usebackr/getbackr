'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';

export default function DonationsPage() {
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/user/donations')
      .then((r) => r.json())
      .then((data) => {
        if (data.donations) setDonations(data.donations);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar />
      <main className="dash-main" style={{ flex: 1 }}>
        <header style={{ marginBottom: '40px' }}>
          <button
            onClick={() => window.location.href = '/dashboard'}
            style={{
              background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
              marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600,
              padding: '0', fontSize: '0.9rem'
            }}
          >
            ← Back to Dashboard
          </button>
          <h1 style={{ fontSize: '2rem', marginBottom: '4px' }}>My Donations</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Projects you have backed
          </p>
        </header>

        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        ) : donations.length === 0 ? (
          <div className="dash-card" style={{ padding: '60px 48px', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '40px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', fontWeight: 800 }}>No donations yet</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontWeight: 500 }}>
              When you back a project, it will appear here.
            </p>
            <a
              href="/explore"
              className="btn-primary"
              style={{ padding: '14px 40px', textDecoration: 'none', display: 'inline-block' }}
            >
              Discover Projects
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {donations.map((d: any) => (
              <div
                key={d.id}
                className="dash-card"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div>
                  <p style={{ fontWeight: 700, marginBottom: '4px' }}>
                    {d.campaignTitle || 'Campaign'}
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {new Date(d.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p
                    style={{ fontWeight: 800, color: 'var(--accent-primary)', fontSize: '1.1rem' }}
                  >
                    ₦{Number(d.amount).toLocaleString()}
                  </p>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: '#dcfce7',
                      color: '#166534',
                    }}
                  >
                    Confirmed
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
