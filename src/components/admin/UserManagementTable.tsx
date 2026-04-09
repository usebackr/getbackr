'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export function UserManagementTable({
  initialUsers,
  totalCount = 0,
  currentPage = 1,
}: {
  initialUsers: any[];
  totalCount?: number;
  currentPage?: number;
}) {
  const [users, setUsers] = useState<any[]>(initialUsers);
  const [updating, setUpdating] = useState<string | null>(null);
  const router = useRouter();

  async function handleToggleBeta(userId: string, currentBeta: boolean) {
    setUpdating(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBeta: !currentBeta }),
      });
      if (res.ok) {
        setUsers(users.map((u) => (u.id === userId ? { ...u, isBeta: !currentBeta } : u)));
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
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kycStatus: 'verified' }),
      });
      if (res.ok) {
        setUsers(users.map((u) => (u.id === userId ? { ...u, kycStatus: 'verified' } : u)));
      }
    } catch (err) {
      console.error('Failed to verify KYC');
    } finally {
      setUpdating(null);
    }
  }

  async function handleRevokeKYC(userId: string, email: string) {
    const reason = window.prompt(
      `Please provide a reason for revoking KYC for ${email}:`,
      'Discrepancy detected in documents.',
    );

    if (reason === null) return; // Cancelled

    setUpdating(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kycStatus: 'unsubmitted',
          kycRejectionReason: reason,
        }),
      });

      if (res.ok) {
        setUsers(users.map((u) => (u.id === userId ? { ...u, kycStatus: 'unsubmitted' } : u)));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to revoke KYC');
      }
    } catch (err) {
      console.error('Failed to revoke KYC');
      alert('Network error during revocation');
    } finally {
      setUpdating(null);
    }
  }

  async function handleDeleteUser(userId: string, email: string) {
    if (
      !window.confirm(
        `WARNING: PERMANENT DELETION: Are you sure you want to delete ${email}? This will erase all their campaigns, contributions, and wallet data. This CANNOT be undone.`,
      )
    ) {
      return;
    }

    setUpdating(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setUsers(users.filter((u) => u.id !== userId));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Failed to delete user');
      alert('Network error during deletion');
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <th
              style={{
                padding: '16px 24px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#475569',
                textTransform: 'uppercase',
              }}
            >
              Member
            </th>
            <th
              style={{
                padding: '16px 24px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#475569',
                textTransform: 'uppercase',
              }}
            >
              Beta Access
            </th>
            <th
              style={{
                padding: '16px 24px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#475569',
                textTransform: 'uppercase',
              }}
            >
              Verification
            </th>
            <th
              style={{
                padding: '16px 24px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#475569',
                textTransform: 'uppercase',
              }}
            >
              Last Active
            </th>
            <th
              style={{
                padding: '16px 24px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#475569',
                textTransform: 'uppercase',
              }}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              style={{ borderBottom: '1px solid #f1f5f9', opacity: updating === user.id ? 0.5 : 1 }}
            >
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
                <span
                  style={{
                    padding: '4px 10px',
                    background: user.kycStatus === 'verified' ? '#eff6ff' : '#fff7ed',
                    color: user.kycStatus === 'verified' ? '#2563eb' : '#d97706',
                    borderRadius: '99px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                  }}
                >
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
                  {user.kycStatus === 'verified' && (
                    <button
                      onClick={() => handleRevokeKYC(user.id, user.email)}
                      disabled={!!updating}
                      style={{
                        padding: '6px 12px',
                        background: '#fff7ed',
                        color: '#d97706',
                        border: '1px solid #fed7aa',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Revoke
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteUser(user.id, user.email)}
                    disabled={!!updating}
                    style={{
                      padding: '6px 12px',
                      background: '#fef2f2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalCount > 50 && (
        <div
          style={{
            padding: '16px 24px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
            Showing page {currentPage} of {Math.ceil(totalCount / 50)} ({totalCount} total)
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              disabled={currentPage <= 1}
              onClick={() => router.push(`/admin/users?page=${currentPage - 1}`)}
              style={{
                padding: '6px 12px',
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage <= 1 ? 0.5 : 1,
              }}
            >
              Previous
            </button>
            <button
              disabled={currentPage * 50 >= totalCount}
              onClick={() => router.push(`/admin/users?page=${currentPage + 1}`)}
              style={{
                padding: '6px 12px',
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: currentPage * 50 >= totalCount ? 'not-allowed' : 'pointer',
                opacity: currentPage * 50 >= totalCount ? 0.5 : 1,
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
