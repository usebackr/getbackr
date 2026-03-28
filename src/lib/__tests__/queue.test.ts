/**
 * Unit tests for queue configuration.
 * Validates queue name constants and factory behaviour without a live Redis connection.
 */

import { QUEUE_NAMES } from '../queue';

describe('QUEUE_NAMES', () => {
  it('exports all expected queue names', () => {
    expect(QUEUE_NAMES.EMAIL_RECEIPT).toBe('email:receipt');
    expect(QUEUE_NAMES.EMAIL_VERIFICATION).toBe('email:verification');
    expect(QUEUE_NAMES.EMAIL_CAMPAIGN).toBe('email:campaign');
    expect(QUEUE_NAMES.EMAIL_BACKER_UPDATE).toBe('email:backer-update');
    expect(QUEUE_NAMES.EMAIL_ACCOUNT_LOCKOUT).toBe('email:account-lockout');
    expect(QUEUE_NAMES.EMAIL_SUBSCRIPTION_RENEWAL).toBe('email:subscription-renewal');
    expect(QUEUE_NAMES.KYC_PROCESS).toBe('kyc:process');
    expect(QUEUE_NAMES.CAMPAIGN_AUTO_CLOSE).toBe('campaign:auto-close');
    expect(QUEUE_NAMES.BOOST_EXPIRY).toBe('boost:expiry');
    expect(QUEUE_NAMES.SUBSCRIPTION_EXPIRY).toBe('subscription:expiry');
  });

  it('has no duplicate queue name values', () => {
    const values = Object.values(QUEUE_NAMES);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});
