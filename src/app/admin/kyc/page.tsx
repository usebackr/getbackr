import React from 'react';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { kycProfiles } from '@/db/schema/kycProfiles';
import { eq } from 'drizzle-orm';
import KycActionButtons from './KycActionButtons';

export const dynamic = 'force-dynamic';

export default async function AdminKycPage() {
  // Fetch pending users and their corresponding KYC submitted documents
  const pendingRequests = await db
    .select({
      userId: users.id,
      email: users.email,
      displayName: users.displayName,
      submittedAt: kycProfiles.createdAt,
      legalName: kycProfiles.legalName,
      idType: kycProfiles.idType,
      idNumber: kycProfiles.idNumber,
      documentUrl: kycProfiles.documentUrl,
    })
    .from(kycProfiles)
    .innerJoin(users, eq(users.id, kycProfiles.userId))
    .where(eq(users.kycStatus, 'pending'));

  return (
    <div>
      <div style={{ marginBottom: '40px' }}>
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 900,
            color: '#0f172a',
            marginBottom: '8px',
            fontFamily: 'Outfit, sans-serif',
          }}
        >
          KYC Approvals
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.05rem', fontWeight: 500 }}>
          Review identity documents to unlock creator withdrawals.
        </p>
      </div>

      {pendingRequests.length === 0 ? (
        <div
          style={{
            padding: '64px',
            textAlign: 'center',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px dashed #cbd5e1',
          }}
        >
          <p style={{ color: '#64748b', fontSize: '1.1rem', fontWeight: 600 }}>
            Zero pending KYC requests. You're all caught up!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {pendingRequests.map((req) => (
            <div
              key={req.userId}
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '32px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '32px',
                justifyContent: 'space-between',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              }}
            >
              <div
                style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  {req.displayName}
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Account: {req.email}</p>

                <div
                  style={{
                    marginTop: '16px',
                    padding: '16px',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '8px' }}>
                    <strong>Legal Name Form:</strong> {req.legalName || 'Not Provided'}
                  </p>
                  <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '8px' }}>
                    <strong>ID Type:</strong> {req.idType || 'Not Provided'}
                  </p>
                  <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '8px' }}>
                    <strong>ID Number:</strong> {req.idNumber || 'Not Provided'}
                  </p>
                  {req.documentUrl ? (
                    <a
                      href={req.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '0.9rem',
                        color: 'var(--accent-primary)',
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      View Identity Document ↗
                    </a>
                  ) : (
                    <p style={{ fontSize: '0.9rem', color: '#ef4444', fontWeight: 600 }}>
                      No document uploaded.
                    </p>
                  )}
                </div>
              </div>

              <div
                style={{
                  flex: '0 0 auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  minWidth: '250px',
                }}
              >
                <KycActionButtons userId={req.userId} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
