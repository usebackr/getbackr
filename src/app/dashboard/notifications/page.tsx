'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';

export default function NotificationsPage() {
  const notifications = [
    {
      icon: '🎉',
      title: 'Welcome to Backr!',
      desc: 'Your account is set up and ready to go. Create your first campaign!',
      time: 'Just now',
    },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar />
      <main className="dash-main" style={{ flex: 1 }}>
        <header style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '4px' }}>Notifications</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Stay updated on your campaigns and backers
          </p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '720px' }}>
          {notifications.map((n, i) => (
            <div
              key={i}
              className="dash-card"
              style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}
            >
              <div style={{ fontSize: '2rem', flexShrink: 0 }}>{n.icon}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, marginBottom: '4px' }}>{n.title}</p>
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                    marginBottom: '8px',
                  }}
                >
                  {n.desc}
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{n.time}</p>
              </div>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: 'var(--accent-primary)',
                  flexShrink: 0,
                  marginTop: '6px',
                }}
              ></div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
