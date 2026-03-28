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
          <h1 style={{ fontSize: '2rem', marginBottom: '4px' }}>My Donations</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Projects you have backed
          </p>
        </header>

        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        ) : donations.length === 0 ? (
          <div className="dash-card" style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🤝</div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>No donations yet</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              When you back a project, it will appear here.
            </p>
            <a
              href="/explore"
              className="btn-primary"
              style={{ padding: '12px 32px', textDecoration: 'none' }}
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
