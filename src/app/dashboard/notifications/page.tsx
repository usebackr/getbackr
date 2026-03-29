'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';

export default function NotificationsPage() {
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/notifications')
      .then((res) => res.json())
      .then((data) => {
        if (data.notifications) setNotifications(data.notifications);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    // Mark as read after 2 seconds
    const timer = setTimeout(() => {
      fetch('/api/notifications', { method: 'PUT' }).catch(() => {});
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const getRelativeTime = (dateStr: string) => {
    const diff = new Date().getTime() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar />
      <main className="dash-main" style={{ flex: 1 }}>
        <header style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a 
            href="/dashboard" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '40px', 
              height: '40px', 
              borderRadius: '12px', 
              background: '#fff', 
              border: '1px solid #e2e8f0',
              color: '#475569',
              textDecoration: 'none'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
          </a>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '4px', fontWeight: 900 }}>Notifications</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>
              Showing your last 3 updates
            </p>
          </div>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '720px' }}>
          {loading ? (
            <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading your alerts...</p>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
              <p style={{ color: '#64748b', fontWeight: 600 }}>All caught up! No new notifications.</p>
            </div>
          ) : (
            notifications.slice(0, 3).map((n) => (
              <div
                key={n.id}
                className="dash-card"
                style={{ 
                  display: 'flex', 
                  gap: '16px', 
                  alignItems: 'flex-start',
                  borderLeft: !n.isRead ? '4px solid var(--accent-primary)' : '1px solid #e2e8f0'
                }}
              >
                <div style={{ fontSize: '2rem', flexShrink: 0 }}>
                  {n.type === 'donation_received' ? '💰' : '🎉'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, marginBottom: '4px' }}>{n.title}</p>
                  <p
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.9rem',
                      marginBottom: '8px',
                    }}
                  >
                    {n.message}
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                    {getRelativeTime(n.createdAt)}
                  </p>
                </div>
                {!n.isRead && (
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
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
