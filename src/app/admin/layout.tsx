import React from 'react';
import { redirect } from 'next/navigation';
import { verifyAdmin } from '@/lib/auth/admin';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    redirect('/dashboard'); // Kick out normal users instantly
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f8fafc' }}>
      {/* Admin Sidebar */}
      <aside
        style={{
          width: '280px',
          background: '#0f172a',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: '24px', borderBottom: '1px solid #1e293b' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'Outfit, sans-serif' }}>
            backr<span style={{ color: '#38bdf8' }}>.admin</span>
          </h1>
        </div>
        <nav
          style={{
            padding: '24px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            flex: 1,
          }}
        >
          <a
            href="/admin"
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              color: '#f8fafc',
              textDecoration: 'none',
              fontWeight: 600,
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              transition: 'background 0.2s',
              background: 'rgba(255,255,255,0.05)',
            }}
          >
            ✦ Platform Overview
          </a>
          <a
            href="/admin/kyc"
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              color: '#cbd5e1',
              textDecoration: 'none',
              fontWeight: 500,
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              transition: 'color 0.2s',
            }}
          >
            ⚑ KYC Approvals
          </a>
          <a
            href="/admin/users"
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              color: '#cbd5e1',
              textDecoration: 'none',
              fontWeight: 500,
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              transition: 'color 0.2s',
            }}
          >
            👥 User Management
          </a>
          <a
            href="/admin/withdrawals"
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              color: '#cbd5e1',
              textDecoration: 'none',
              fontWeight: 500,
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              transition: 'color 0.2s',
            }}
          >
            ₦ Transfer Payouts
          </a>
        </nav>
        <div style={{ padding: '24px', borderTop: '1px solid #1e293b' }}>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Logged in as Master Admin</p>
        </div>
      </aside>

      {/* Admin Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <header
          style={{
            background: '#ffffff',
            padding: '24px 40px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Platform Operations Center
          </h2>
          <a
            href="/dashboard"
            style={{
              color: '#64748b',
              fontSize: '0.9rem',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Exit Admin ↑
          </a>
        </header>
        <div style={{ padding: '40px', flex: 1 }}>{children}</div>
      </main>
    </div>
  );
}
