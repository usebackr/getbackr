import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),

  // Redis
  REDIS_URL: z.string().url('REDIS_URL must be a valid URL').optional().default('redis://localhost:6379'),

  // Auth
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_SECRET: z.string().min(32, 'REFRESH_TOKEN_SECRET must be at least 32 characters').optional().default('dummy-refresh-secret-not-for-prod-32-chars'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Payment Gateways
  PAYSTACK_SECRET_KEY: z.string().min(1),
  PAYSTACK_PUBLIC_KEY: z.string().min(1),
  FLUTTERWAVE_SECRET_KEY: z.string().min(1).optional().default('dummy'),
  FLUTTERWAVE_PUBLIC_KEY: z.string().min(1).optional().default('dummy'),
  PAYMENT_WEBHOOK_SECRET: z.string().min(1).optional().default('dummy'),

  // KYC
  KYC_PROVIDER_API_KEY: z.string().min(1).optional().default('dummy'),
  KYC_PROVIDER_URL: z.string().url().optional().default('https://api.example.com'),

  // Email
  SENDGRID_API_KEY: z.string().min(1).optional().default('dummy'),
  EMAIL_FROM: z.string().email().optional().default('noreply@example.com'),
  EMAIL_FROM_NAME: z.string().default('Backr'),

  // Object Storage
  S3_BUCKET: z.string().min(1).optional().default('dummy'),
  S3_REGION: z.string().min(1).optional().default('us-east-1'),
  S3_ACCESS_KEY_ID: z.string().min(1).optional().default('dummy'),
  S3_SECRET_ACCESS_KEY: z.string().min(1).optional().default('dummy'),
  S3_ENDPOINT: z.string().url().optional().default('https://s3.example.com'),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build' || !!process.env.VERCEL;
    
    if (isBuildPhase) {
      console.warn('⚠️ Some environment variables are missing during build. Using safe defaults.');
      
      const defaults = {
        DATABASE_URL: process.env.DATABASE_URL || 'postgres://dummy:dummy@localhost:5432/dummy',
        JWT_SECRET: process.env.JWT_SECRET || 'dummy-jwt-secret-for-build-analysis-32-chars',
        PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY || 'sk_test_dummy',
        PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY || 'pk_test_dummy',
      };

      // Fill the rest with schema defaults by merging with a valid parse of essential-only data
      return {
        ...envSchema.parse({
           ...defaults,
           REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
           NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        }),
        ...defaults
      } as Env;
    }

    const formatted = result.error.format();
    console.error('❌ Invalid environment variables:', JSON.stringify(formatted, null, 2));
    throw new Error('Invalid environment variables. Check your .env file.');
  }

  return result.data;
}

// Lazy singleton — only validated once on first access
let _env: Env | undefined;

export function getEnv(): Env {
  if (!_env) {
    _env = parseEnv();
  }
  return _env;
}

// Named exports for convenience
export const env = new Proxy({} as Env, {
  get(_target, prop: string) {
    return getEnv()[prop as keyof Env];
  },
});
