'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const Icons = {
  Menu: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  Close: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Campaigns: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Wallet: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  ),
  Profile: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Donations: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" />
    </svg>
  ),
  Discover: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Notifications: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  Bell: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  Settings: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  Logout: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastNotificationId, setLastNotificationId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState<any>(null);

  // Poll for notifications
  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const res = await fetch('/api/notifications');
        
        // Handle session expiry during background poll
        if (res.status === 401) {
          console.warn('[Sidebar] Session expired during poll');
          window.location.href = '/login?error=session_expired';
          return;
        }

        const data = await res.json();
        if (data.notifications) {
          const unread = data.notifications.filter((n: any) => !n.isRead);
          setUnreadCount(unread.length);

          if (unread.length > 0 && unread[0].id !== lastNotificationId) {
            // New unread notification! Show toast
            setLastNotificationId(unread[0].id);
            setShowToast(unread[0]);
            setTimeout(() => setShowToast(null), 5000);
          }
        }
      } catch (err) {
        console.error('Failed to fetch notifications polling');
      }
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 30000);
    return () => clearInterval(interval);
  }, [lastNotificationId]);

  // Prevent scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  const menuItems = [
    { label: 'Dashboard', icon: <Icons.Campaigns />, path: '/dashboard' },
    { label: 'Wallet', icon: <Icons.Wallet />, path: '/dashboard/wallet' },
    { label: 'Donations', icon: <Icons.Donations />, path: '/dashboard/donations' },
    { label: 'Profile', icon: <Icons.Profile />, path: '/dashboard/profile' },
    { label: 'Explore', icon: <Icons.Discover />, path: '/explore' },
  ];

  const secondaryItems = [
    { label: 'Identity Verification', icon: <Icons.Profile />, path: '/dashboard/identity' },
    { label: 'Notifications', icon: <Icons.Notifications />, path: '/dashboard/notifications', count: unreadCount },
    { label: 'Settings', icon: <Icons.Settings />, path: '/dashboard/settings' },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error('Logout failed');
    }
  };

  return (
    <>
      {/* Toast Alert */}
      {showToast && (
        <div 
          className="notification-toast glass"
          onClick={() => {
            router.push('/dashboard/notifications');
            setShowToast(null);
          }}
        >
          <div style={{ fontSize: '1.5rem' }}>💰</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 800, fontSize: '0.85rem' }}>{showToast.title}</p>
            <p style={{ fontSize: '0.8rem', color: '#475569' }}>{showToast.message}</p>
          </div>
        </div>
      )}

      {/* Mobile Header (Dashboard specific) */}
      <header className="mobile-header">
        <a href="/" style={{ textDecoration: 'none' }}>
          <h2 className="text-gradient" style={{ fontSize: '1.4rem', fontWeight: 900 }}>
            Backr
          </h2>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <a href="/dashboard/notifications" style={{ position: 'relative', color: '#475569', padding: '8px' }}>
            <Icons.Bell />
            {unreadCount > 0 && (
              <span className="badge-pulse">{unreadCount}</span>
            )}
          </a>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="nav-toggle"
            style={{ display: 'block' }}
          >
            {isOpen ? <Icons.Close /> : <Icons.Menu />}
          </button>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {isOpen && <div onClick={() => setIsOpen(false)} className="sidebar-overlay" />}

      <aside className={`sidebar-aside ${isOpen ? 'open' : ''}`}>
        <div style={{ padding: '40px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <h2 className="text-gradient" style={{ fontSize: '1.8rem', fontWeight: 900 }}>
              Backr
            </h2>
          </a>
          <button
            className="mobile-only-close"
            onClick={() => setIsOpen(false)}
          >
            <Icons.Close />
          </button>
        </div>

        <nav style={{ flex: 1, padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
             <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', padding: '0 16px 8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Main Menu</p>
            {menuItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                onClick={() => setIsOpen(false)}
                className={`sidebar-link ${pathname === item.path ? 'active' : ''}`}
              >
                {item.icon}
                {item.label}
              </a>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', padding: '0 16px 8px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Account</p>
            {secondaryItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                onClick={() => setIsOpen(false)}
                className={`sidebar-link ${pathname === item.path ? 'active' : ''}`}
                style={{ position: 'relative' }}
              >
                {item.icon}
                {item.label}
                {item.count && item.count > 0 && (
                  <span style={{ 
                    marginLeft: 'auto', 
                    background: '#ef4444', 
                    color: '#fff', 
                    fontSize: '0.7rem', 
                    padding: '2px 8px', 
                    borderRadius: '20px',
                    fontWeight: 800
                  }}>
                    {item.count}
                  </span>
                )}
              </a>
            ))}
          </div>
        </nav>

        <div style={{ padding: '32px 16px', borderTop: '1px solid #f1f5f9' }}>
          <button
            onClick={handleLogout}
            className="sidebar-link-danger"
          >
            <Icons.Logout /> Log out
          </button>
        </div>
      </aside>

      <style jsx>{`
        .notification-toast {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9999;
          width: 90%;
          max-width: 400px;
          padding: 16px 20px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid #e2e8f0;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          animation: slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes slideDown {
          from { transform: translate(-50%, -100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }

        .badge-pulse {
          position: absolute;
          top: 4px;
          right: 4px;
          background: #ef4444;
          color: white;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 2px 5px;
          border-radius: 10px;
          border: 2px solid #fff;
        }

        .mobile-only-close {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-primary);
          padding: 8px;
        }
        
        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 12px;
          text-decoration: none;
          color: #475569;
          font-weight: 600;
          font-size: 0.95rem;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .sidebar-link:hover {
          background: #f8fafc;
          color: var(--text-primary);
        }

        .sidebar-link.active {
          color: #ffffff;
          background: var(--accent-primary);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
        }

        .sidebar-link-danger {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 12px;
          border: none;
          background: transparent;
          color: #ef4444;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .sidebar-link-danger:hover {
          background: #fef2f2;
        }

        @media (max-width: 1024px) {
          .mobile-only-close {
            display: block;
          }
        }
      `}</style>
    </>
  );
}
