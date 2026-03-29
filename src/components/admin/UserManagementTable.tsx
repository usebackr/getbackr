'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  displayName: string;
  email: string;
  isBeta: boolean;
  kycStatus: string;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export function UserManagementTable({ initialUsers }: { initialUsers: any[] }) {
  const [users, setUsers] = useState<any[]>(initialUsers);
  const [updating, setUpdating] = useState<string | null>(null);
  const router = useRouter();

  async function handleToggleBeta(userId: string, currentBeta: boolean) {
    setUpdating(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBeta: !currentBeta }),
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, isBeta: !currentBeta } : u));
      }
    } catch (err) {
      console.error('Failed to update beta status');
    } finally {
      setUpdating(null);
    }
  }

  async function handleVerifyKYC(userId: string) {
    setUpdating(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kycStatus: 'verified' }),
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, kycStatus: 'verified' } : u));
      }
    } catch (err) {
      console.error('Failed to verify KYC');
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <th style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Member</th>
            <th style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Beta Access</th>
            <th style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Verification</th>
            <th style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Last Active</th>
            <th style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9', opacity: updating === user.id ? 0.5 : 1 }}>
              <td style={{ padding: '20px 24px' }}>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{user.displayName}</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{user.email}</div>
              </td>
              <td style={{ padding: '20px 24px' }}>
                <button
                  onClick={() => handleToggleBeta(user.id, user.isBeta)}
                  disabled={!!updating}
                  style={{
                    padding: '6px 14px',
                    background: user.isBeta ? '#ecfdf5' : '#f8fafc',
                    color: user.isBeta ? '#059669' : '#64748b',
                    border: `1px solid ${user.isBeta ? '#10b981' : '#e2e8f0'}`,
                    borderRadius: '99px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {user.isBeta ? 'BETA: ON' : 'BETA: OFF'}
                </button>
              </td>
              <td style={{ padding: '20px 24px' }}>
                <span style={{ 
                  padding: '4px 10px', 
                  background: user.kycStatus === 'verified' ? '#eff6ff' : '#fff7ed', 
                  color: user.kycStatus === 'verified' ? '#2563eb' : '#d97706', 
                  borderRadius: '99px', 
                  fontSize: '0.75rem', 
                  fontWeight: 800,
                  textTransform: 'uppercase'
                }}>
                  {user.kycStatus}
                </span>
              </td>
              <td style={{ padding: '20px 24px', fontSize: '0.9rem', color: '#475569' }}>
                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
              </td>
              <td style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {user.kycStatus !== 'verified' && (
                    <button
                      onClick={() => handleVerifyKYC(user.id)}
                      disabled={!!updating}
                      style={{
                        padding: '6px 12px',
                        background: '#0f172a',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Verify
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
