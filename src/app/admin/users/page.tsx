import React from 'react';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { desc, sql } from 'drizzle-orm';
import { verifyAdminApi } from '@/lib/auth/admin';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { UserManagementTable } from '@/components/admin/UserManagementTable';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage({ searchParams }: { searchParams: { page?: string } }) {
  const token = cookies().get('accessToken')?.value;
  const isAdmin = await verifyAdminApi(token);
  if (!isAdmin) redirect('/login');

  const page = parseInt(searchParams.page || '1', 10);
  const limitCount = 50;
  const offsetCount = (page - 1) * limitCount;

  // Use raw SQL for newer columns (is_beta, last_login_at) so the page
  // doesn't crash if the migration hasn't been applied to production yet.
  let allUsers: any[] = [];
  let totalCount = 0;
  let betaUsersCount = 0;
  let verifiedCount = 0;
  let fetchError = false;

  try {
    const statsQuery = await db.execute(sql`
      SELECT 
        COUNT(*)::int as total,
        COALESCE(SUM(CASE WHEN is_beta = true THEN 1 ELSE 0 END), 0)::int as beta_count,
        COALESCE(SUM(CASE WHEN kyc_status = 'verified' THEN 1 ELSE 0 END), 0)::int as verified_count
      FROM users
    `);
    if (statsQuery.rows && statsQuery.rows[0]) {
      const row: any = statsQuery.rows[0];
      totalCount = Number(row.total);
      betaUsersCount = Number(row.beta_count);
      verifiedCount = Number(row.verified_count);
    } else if (Array.isArray(statsQuery) && statsQuery[0]) {
      const row: any = statsQuery[0];
      totalCount = Number(row.total);
      betaUsersCount = Number(row.beta_count);
      verifiedCount = Number(row.verified_count);
    }

    allUsers = await db
      .select({
        id: users.id,
        displayName: users.displayName,
        email: users.email,
        isBeta: sql<boolean>`COALESCE(is_beta, false)`,
        lastLoginAt: sql<Date | null>`last_login_at`,
        createdAt: users.createdAt,
        kycStatus: sql<string>`COALESCE(kyc_status::text, 'pending')`,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limitCount)
      .offset(offsetCount);
  } catch (err) {
    console.error('[AdminUsers] DB query failed:', err);
    fetchError = true;
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>User Management</h1>
          <p style={{ color: '#64748b', fontSize: '1.05rem', marginTop: '4px' }}>
            Auditing {allUsers.length} total members ({betaUsersCount} with Beta access).
          </p>
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#059669' }}>{verifiedCount}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Verified KYC</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#3b82f6' }}>{betaUsersCount}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Beta Early Access</div>
          </div>
        </div>
      </div>

      {fetchError && (
        <div style={{ padding: '16px 24px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', color: '#dc2626', marginBottom: '24px', fontSize: '0.9rem' }}>
          ⚠️ Could not load user data — the database may need a migration. Run <code>npm run db:migrate</code> on the production database.
        </div>
      )}

      <UserManagementTable initialUsers={allUsers} totalCount={totalCount} currentPage={page} />
      
      <div style={{ marginTop: '40px', padding: '24px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>Security &amp; Compliance Tip</h4>
        <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
          Verify identity documents carefully before manually approving KYC. Once verified, users gain access to withdrawal features.
          Granting Beta access allows users to participate in restricted campaign categories and community feedback loops.
        </p>
      </div>
    </div>
  );
}
