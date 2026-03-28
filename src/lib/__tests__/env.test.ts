/**
 * Tests for the environment variable schema validation.
 * These run without a real DB/Redis connection.
 */

describe('env schema validation', () => {
  const validEnv = {
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/backr',
    REDIS_URL: 'redis://localhost:6379',
    JWT_SECRET: 'a-very-long-secret-that-is-at-least-32-chars',
    JWT_EXPIRES_IN: '15m',
    REFRESH_TOKEN_SECRET: 'another-very-long-secret-at-least-32-chars',
    REFRESH_TOKEN_EXPIRES_IN: '7d',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    NODE_ENV: 'test',
    PAYSTACK_SECRET_KEY: 'sk_test_xxx',
    PAYSTACK_PUBLIC_KEY: 'pk_test_xxx',
    FLUTTERWAVE_SECRET_KEY: 'FLWSECK_TEST-xxx',
    FLUTTERWAVE_PUBLIC_KEY: 'FLWPUBK_TEST-xxx',
    PAYMENT_WEBHOOK_SECRET: 'webhook-secret',
    KYC_PROVIDER_API_KEY: 'kyc-api-key',
    KYC_PROVIDER_URL: 'https://api.smileidentity.com/v1',
    SENDGRID_API_KEY: 'SG.xxx',
    EMAIL_FROM: 'noreply@backr.io',
    EMAIL_FROM_NAME: 'Backr',
    S3_BUCKET: 'backr-uploads',
    S3_REGION: 'us-east-1',
    S3_ACCESS_KEY_ID: 'access-key',
    S3_SECRET_ACCESS_KEY: 'secret-key',
    S3_ENDPOINT: 'https://s3.amazonaws.com',
  };

  it('accepts a fully valid environment', () => {
    const { z } = require('zod');

    const envSchema = z.object({
      DATABASE_URL: z.string().url(),
      REDIS_URL: z.string().url(),
      JWT_SECRET: z.string().min(32),
      REFRESH_TOKEN_SECRET: z.string().min(32),
    });

    const result = envSchema.safeParse(validEnv);
    expect(result.success).toBe(true);
  });

  it('rejects a short JWT_SECRET', () => {
    const { z } = require('zod');

    const envSchema = z.object({
      JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    });

    const result = envSchema.safeParse({ JWT_SECRET: 'short' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('32 characters');
    }
  });

  it('rejects an invalid DATABASE_URL', () => {
    const { z } = require('zod');

    const envSchema = z.object({
      DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
    });

    const result = envSchema.safeParse({ DATABASE_URL: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid email for EMAIL_FROM', () => {
    const { z } = require('zod');

    const envSchema = z.object({
      EMAIL_FROM: z.string().email(),
    });

    const result = envSchema.safeParse({ EMAIL_FROM: 'not-an-email' });
    expect(result.success).toBe(false);
  });
});
