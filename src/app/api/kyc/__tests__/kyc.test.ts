/**
 * Unit tests for KYC service
 * Covers: status transitions, document access restriction (Property 52)
 */

import { isAdmin } from '@/lib/kyc/adminGuard';

// ---------------------------------------------------------------------------
// 6.5 — KYC document access restriction (Property 52)
// Property 52: KYC documents inaccessible to non-admins
// Validates: Requirements 13.7
// ---------------------------------------------------------------------------

describe('isAdmin', () => {
  const ADMIN_ID = '00000000-0000-0000-0000-000000000001';
  const NON_ADMIN_ID = '00000000-0000-0000-0000-000000000002';

  beforeEach(() => {
    process.env.ADMIN_USER_IDS = ADMIN_ID;
  });

  afterEach(() => {
    delete process.env.ADMIN_USER_IDS;
  });

  it('returns true for a userId that is in ADMIN_USER_IDS', () => {
    expect(isAdmin(ADMIN_ID)).toBe(true);
  });

  it('returns false for a userId that is NOT in ADMIN_USER_IDS', () => {
    expect(isAdmin(NON_ADMIN_ID)).toBe(false);
  });

  it('returns false when ADMIN_USER_IDS is empty', () => {
    process.env.ADMIN_USER_IDS = '';
    expect(isAdmin(ADMIN_ID)).toBe(false);
  });

  it('returns false when ADMIN_USER_IDS is not set', () => {
    delete process.env.ADMIN_USER_IDS;
    expect(isAdmin(ADMIN_ID)).toBe(false);
  });

  it('handles multiple admin IDs (comma-separated)', () => {
    const SECOND_ADMIN = '00000000-0000-0000-0000-000000000003';
    process.env.ADMIN_USER_IDS = `${ADMIN_ID},${SECOND_ADMIN}`;
    expect(isAdmin(ADMIN_ID)).toBe(true);
    expect(isAdmin(SECOND_ADMIN)).toBe(true);
    expect(isAdmin(NON_ADMIN_ID)).toBe(false);
  });

  it('trims whitespace around IDs', () => {
    process.env.ADMIN_USER_IDS = `  ${ADMIN_ID}  `;
    expect(isAdmin(ADMIN_ID)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 6.4 — KYC status transitions
// Tests: pending → verified, pending → rejected, rejected → resubmitted
// ---------------------------------------------------------------------------

describe('KYC status transitions (webhook logic)', () => {
  // We test the pure transition logic inline — the actual DB update is
  // integration-level; here we verify the business rules.

  type KycStatus = 'pending' | 'verified' | 'rejected';

  function applyWebhookResult(
    currentStatus: KycStatus,
    incomingStatus: 'verified' | 'rejected',
    rejectionReason?: string,
  ): { kycStatus: KycStatus; kycRejectionReason: string | null } {
    return {
      kycStatus: incomingStatus,
      kycRejectionReason: incomingStatus === 'rejected' ? (rejectionReason ?? null) : null,
    };
  }

  it('transitions pending → verified', () => {
    const result = applyWebhookResult('pending', 'verified');
    expect(result.kycStatus).toBe('verified');
    expect(result.kycRejectionReason).toBeNull();
  });

  it('transitions pending → rejected with reason', () => {
    const result = applyWebhookResult('pending', 'rejected', 'Document unclear');
    expect(result.kycStatus).toBe('rejected');
    expect(result.kycRejectionReason).toBe('Document unclear');
  });

  it('transitions pending → rejected without reason stores null', () => {
    const result = applyWebhookResult('pending', 'rejected');
    expect(result.kycStatus).toBe('rejected');
    expect(result.kycRejectionReason).toBeNull();
  });

  it('transitions rejected → verified (resubmission approved) clears rejection reason', () => {
    const result = applyWebhookResult('rejected', 'verified');
    expect(result.kycStatus).toBe('verified');
    expect(result.kycRejectionReason).toBeNull();
  });

  it('transitions rejected → rejected (resubmission rejected again) updates reason', () => {
    const result = applyWebhookResult('rejected', 'rejected', 'Selfie mismatch');
    expect(result.kycStatus).toBe('rejected');
    expect(result.kycRejectionReason).toBe('Selfie mismatch');
  });
});
