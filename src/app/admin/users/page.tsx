import React from 'react';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { desc, sql, eq } from 'drizzle-orm';
import { verifyAdminApi } from '@/lib/auth/admin';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const token = cookies().get('accessToken')?.value;
  const isAdmin = await verifyAdminApi(token);
  if (!isAdmin) redirect('/login');

  const allUsers = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      email: users.email,
      isBeta: users.isBeta,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
      kycStatus: users.kycStatus,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  const betaUsersCount = allUsers.filter(u => u.isBeta).length;

  return (
    <div style={{ padding: '40px' }}>
      <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>User Management</h1>
          <p style={{ color: '#64748b', fontSize: '1.05rem', marginTop: '4px' }}>
            Monitoring {allUsers.length} total members ({betaUsersCount} from Beta).
          </p>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Member</th>
              <th style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Source</th>
              <th style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Verification</th>
              <th style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Last Active</th>
              <th style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Joined</th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '20px 24px' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{user.displayName}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{user.email}</div>
                </td>
                <td style={{ padding: '20px 24px' }}>
                  {user.isBeta ? (
                    <span style={{ padding: '4px 10px', background: '#ecfdf5', color: '#059669', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 800 }}>BETA ACCESS</span>
                  ) : (
                    <span style={{ padding: '4px 10px', background: '#f1f5f9', color: '#64748b', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 800 }}>ORGANIC</span>
                  )}
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
                <td style={{ padding: '20px 24px', fontSize: '0.9rem', color: '#475569' }}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
