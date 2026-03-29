import React from 'react';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { kycProfiles } from '@/db/schema/kycProfiles';
import { eq } from 'drizzle-orm';
import KycActionButtons from './KycActionButtons';
import { getPublicUrl } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export default async function AdminKycPage() {
  // Fetch pending users and their corresponding KYC submitted documents
  const allRequests = await db
    .select({
      userId: users.id,
      email: users.email,
      displayName: users.displayName,
      kycStatus: users.kycStatus,
      submittedAt: kycProfiles.createdAt,
      legalName: kycProfiles.legalName,
      idType: kycProfiles.idType,
      idNumber: kycProfiles.idNumber,
      documentUrl: kycProfiles.documentUrl,
      selfieUrl: kycProfiles.selfieUrl,
      rejectionReason: kycProfiles.rejectionReason,
    })
    .from(kycProfiles)
    .innerJoin(users, eq(users.id, kycProfiles.userId))
    .orderBy(kycProfiles.createdAt);

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1
          style={{
            fontSize: '2.5rem',
            fontWeight: 900,
            color: '#0f172a',
            marginBottom: '8px',
            fontFamily: 'Outfit, sans-serif',
          }}
        >
          KYC Submissions
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.05rem', fontWeight: 500 }}>
          Review and verify user identity documents for platform security.
        </p>
      </div>

      {allRequests.length === 0 ? (
        <div
          style={{
            padding: '80px',
            textAlign: 'center',
            background: '#ffffff',
            borderRadius: '24px',
            border: '2px dashed #e2e8f0',
          }}
        >
          <p style={{ color: '#94a3b8', fontSize: '1.25rem', fontWeight: 600 }}>
            No KYC submissions found in the database.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {allRequests.map((req) => (
            <div
              key={req.userId}
              style={{
                background: '#ffffff',
                borderRadius: '24px',
                border: '1px solid #e2e8f0',
                padding: '40px',
                display: 'grid',
                gridTemplateColumns: '1fr 300px',
                gap: '40px',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
                      {req.displayName}
                    </h3>
                    <span style={{
                      padding: '6px 16px',
                      borderRadius: '30px',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      background: req.kycStatus === 'verified' ? '#dcfce7' : req.kycStatus === 'rejected' ? '#fee2e2' : '#fef3c7',
                      color: req.kycStatus === 'verified' ? '#059669' : req.kycStatus === 'rejected' ? '#dc2626' : '#d97706',
                      border: '1px solid currentColor',
                      opacity: 0.9,
                    }}>
                      {req.kycStatus}
                    </span>
                  </div>
                  <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: 500 }}>Account: <strong>{req.email}</strong></p>
                </div>

                {/* Info Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '24px',
                    padding: '24px',
                    background: '#f8fafc',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Legal Name</label>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>{req.legalName || 'N/A'}</div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>ID Details</label>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>{req.idType} — {req.idNumber}</div>
                  </div>
                </div>

                {req.kycStatus === 'rejected' && req.rejectionReason && (
                  <div style={{ padding: '16px 20px', background: '#fff1f2', border: '1px solid #fda4af', borderRadius: '12px', color: '#be123c' }}>
                    <h5 style={{ margin: '0 0 4px', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase' }}>Rejection Reason</h5>
                    <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.5 }}>{req.rejectionReason}</p>
                  </div>
                )}

                {/* Media Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#64748b', marginBottom: '12px' }}>ID Document (Front)</label>
                    {req.documentUrl ? (
                      <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f1f5f9' }}>
                        <img 
                          src={getPublicUrl(req.documentUrl)} 
                          alt="ID Document" 
                          style={{ width: '100%', height: '240px', objectFit: 'cover' }}
                        />
                        <a 
                          href={getPublicUrl(req.documentUrl)} 
                          target="_blank" 
                          style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(255,255,255,0.9)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none', color: '#0f172a', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                        >
                          View Full Size ↗
                        </a>
                      </div>
                    ) : (
                      <div style={{ height: '240px', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Missing ID</div>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#64748b', marginBottom: '12px' }}>Selfie (Verification)</label>
                    {req.selfieUrl ? (
                      <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f1f5f9' }}>
                        <img 
                          src={getPublicUrl(req.selfieUrl)} 
                          alt="Verification Selfie" 
                          style={{ width: '100%', height: '240px', objectFit: 'cover' }}
                        />
                        <a 
                          href={getPublicUrl(req.selfieUrl)} 
                          target="_blank" 
                          style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(255,255,255,0.9)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none', color: '#0f172a', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                        >
                          View Full Size ↗
                        </a>
                      </div>
                    ) : (
                      <div style={{ height: '240px', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Missing Selfie</div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                {req.kycStatus === 'pending' ? (
                  <KycActionButtons userId={req.userId} />
                ) : (
                  <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 700, margin: 0 }}>Action Completed</p>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>Processed on {req.submittedAt ? new Date(req.submittedAt).toLocaleDateString() : 'N/A'}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
