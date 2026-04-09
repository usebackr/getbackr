/**
 * Auth route unit tests
 * Covers: register, verify-email, login, logout, refresh, 2FA setup/verify
 */

// Mock all external dependencies before imports
jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('@/lib/auth/tokens', () => ({
  generateVerificationToken: jest.fn(() => 'test-verification-token'),
  storeVerificationToken: jest.fn().mockResolvedValue(undefined),
  consumeVerificationToken: jest.fn().mockResolvedValue('user-1'),
}));

jest.mock('@/lib/auth/jwt', () => {
  const actual = jest.requireActual('jsonwebtoken');
  const ACCESS_SECRET = 'access-secret-change-me';
  const REFRESH_SECRET = 'refresh-secret-change-me';

  return {
    signAccessToken: jest.fn((userId) =>
      actual.sign({ sub: userId, type: 'access' }, ACCESS_SECRET, { expiresIn: '15m' }),
    ),
    signRefreshToken: jest.fn((userId) =>
      actual.sign({ sub: userId, type: 'refresh', nonce: Math.random() }, REFRESH_SECRET, {
        expiresIn: '7d',
      }),
    ),
    verifyAccessToken: jest.fn((token) => actual.verify(token, ACCESS_SECRET)),
    verifyRefreshToken: jest.fn((token) => actual.verify(token, REFRESH_SECRET)),
    getRefreshTokenUserId: jest.fn().mockResolvedValue('user-1'),
    invalidateRefreshToken: jest.fn().mockResolvedValue(undefined),
    storeRefreshToken: jest.fn().mockResolvedValue(undefined),
  };
});

jest.mock('@/workers/emailWorkers', () => ({
  sendEmail: jest.fn().mockResolvedValue({ sent: true }),
}));

jest.mock('@/lib/audit', () => ({
  logAuditEvent: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('speakeasy', () => ({
  generateSecret: jest.fn(() => ({
    base32: 'TESTSECRETBASE32',
    otpauth_url: 'otpauth://totp/Backr:test@example.com?secret=TESTSECRETBASE32',
  })),
  totp: {
    verify: jest.fn(() => true),
  },
}));

import { NextRequest } from 'next/server';
import { POST as registerHandler } from '@/app/api/auth/register/route';
import { POST as verifyEmailHandler } from '@/app/api/auth/verify-email/route';
import { POST as loginHandler } from '@/app/api/auth/login/route';
import { POST as logoutHandler } from '@/app/api/auth/logout/route';
import { POST as refreshHandler } from '@/app/api/auth/refresh/route';
import { POST as setup2faHandler } from '@/app/api/auth/2fa/setup/route';
import { POST as verify2faHandler } from '@/app/api/auth/2fa/verify/route';
import { db } from '@/lib/db';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { consumeVerificationToken } from '@/lib/auth/tokens';
import * as speakeasy from 'speakeasy';

// Helper to create a NextRequest
function makeRequest(body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost/api/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

function makeAuthRequest(body: unknown, token: string): NextRequest {
  return makeRequest(body, { Authorization: `Bearer ${token}` });
}

// Helper to create a valid access token
function makeAccessToken(userId: string): string {
  return jwt.sign(
    { sub: userId, type: 'access' },
    process.env.JWT_ACCESS_SECRET ?? 'access-secret-change-me',
    { expiresIn: '15m' },
  );
}

function makeRefreshToken(userId: string): string {
  return jwt.sign(
    { sub: userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET ?? 'refresh-secret-change-me',
    { expiresIn: '7d' },
  );
}

// Setup db mock helpers
function mockDbSelect(rows: unknown[]) {
  const limitMock = jest.fn().mockResolvedValue(rows);
  const whereMock = jest.fn().mockReturnValue({ limit: limitMock });
  const fromMock = jest.fn().mockReturnValue({ where: whereMock });
  (db.select as jest.Mock).mockReturnValue({ from: fromMock });
  return { limitMock, whereMock, fromMock };
}

function mockDbInsert(returning: unknown[]) {
  const returningMock = jest.fn().mockResolvedValue(returning);
  const valuesMock = jest.fn().mockReturnValue({ returning: returningMock });
  (db.insert as jest.Mock).mockReturnValue({ values: valuesMock });
  return { returningMock, valuesMock };
}

function mockDbUpdate() {
  const whereMock = jest.fn().mockResolvedValue([]);
  const setMock = jest.fn().mockReturnValue({ where: whereMock });
  (db.update as jest.Mock).mockReturnValue({ set: setMock });
  return { whereMock, setMock };
}

// ─── REGISTER ────────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  beforeEach(() => jest.clearAllMocks());

  it('registers successfully with valid data', async () => {
    // No existing user
    mockDbSelect([]);
    mockDbInsert([{ id: 'user-1', email: 'test@example.com', displayName: 'Test User' }]);

    const req = makeRequest({
      email: 'test@example.com',
      password: 'Password1',
      displayName: 'Test User',
    });
    const res = await registerHandler(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.message).toMatch(/registration successful/i);
  });

  it('returns 409 for duplicate email', async () => {
    mockDbSelect([{ id: 'existing-user' }]);

    const req = makeRequest({
      email: 'existing@example.com',
      password: 'Password1',
      displayName: 'Test User',
    });
    const res = await registerHandler(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/email already in use/i);
  });

  it('returns 422 for invalid password (too short)', async () => {
    const req = makeRequest({
      email: 'test@example.com',
      password: 'short',
      displayName: 'Test User',
    });
    const res = await registerHandler(req);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.errors).toBeDefined();
  });

  it('returns 422 for password missing uppercase', async () => {
    const req = makeRequest({
      email: 'test@example.com',
      password: 'password1',
      displayName: 'Test User',
    });
    const res = await registerHandler(req);
    expect(res.status).toBe(422);
  });

  it('returns 422 for password missing digit', async () => {
    const req = makeRequest({
      email: 'test@example.com',
      password: 'PasswordOnly',
      displayName: 'Test User',
    });
    const res = await registerHandler(req);
    expect(res.status).toBe(422);
  });

  it('returns 422 for invalid email', async () => {
    const req = makeRequest({
      email: 'not-an-email',
      password: 'Password1',
      displayName: 'Test User',
    });
    const res = await registerHandler(req);
    expect(res.status).toBe(422);
  });
});

// ─── VERIFY EMAIL ─────────────────────────────────────────────────────────────

describe('POST /api/auth/verify-email', () => {
  beforeEach(() => jest.clearAllMocks());

  it('verifies email with valid token', async () => {
    (consumeVerificationToken as jest.Mock).mockResolvedValueOnce('user-1');
    mockDbUpdate();

    const req = makeRequest({ token: 'valid-token-abc123' });
    const res = await verifyEmailHandler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toMatch(/verified/i);
  });

  it('returns 422 for expired/invalid token', async () => {
    (consumeVerificationToken as jest.Mock).mockResolvedValueOnce(null);

    const req = makeRequest({ token: 'expired-token' });
    const res = await verifyEmailHandler(req);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.errors[0].message).toMatch(/invalid or expired/i);
  });

  it('returns 422 when token is missing', async () => {
    const req = makeRequest({});
    const res = await verifyEmailHandler(req);
    expect(res.status).toBe(422);
  });
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  beforeEach(() => jest.clearAllMocks());

  const hashedPassword = bcrypt.hashSync('Password1', 10);

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: hashedPassword,
    displayName: 'Test User',
    emailVerified: true,
    failedLoginCount: 0,
    lockedUntil: null,
    totpSecret: null,
  };

  it('logs in successfully with correct credentials', async () => {
    mockDbSelect([mockUser]);
    mockDbInsert([]); // mock refresh token store
    mockDbUpdate();

    const req = makeRequest({ email: 'test@example.com', password: 'Password1' });
    const res = await loginHandler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBeDefined();
  });

  it('returns 401 for wrong password', async () => {
    mockDbSelect([mockUser]);
    mockDbUpdate();

    const req = makeRequest({ email: 'test@example.com', password: 'WrongPass1' });
    const res = await loginHandler(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/invalid credentials/i);
  });

  it('returns 401 for non-existent user', async () => {
    mockDbSelect([]);

    const req = makeRequest({ email: 'nobody@example.com', password: 'Password1' });
    const res = await loginHandler(req);
    expect(res.status).toBe(401);
  });

  it('returns 423 for locked account', async () => {
    const lockedUser = {
      ...mockUser,
      lockedUntil: new Date(Date.now() + 10 * 60 * 1000), // locked for 10 more minutes
    };
    mockDbSelect([lockedUser]);

    const req = makeRequest({ email: 'test@example.com', password: 'Password1' });
    const res = await loginHandler(req);
    expect(res.status).toBe(423);
    const body = await res.json();
    expect(body.error).toMatch(/locked/i);
    expect(body.secondsRemaining).toBeGreaterThan(0);
  });
});

// ─── LOGOUT ───────────────────────────────────────────────────────────────────

describe('POST /api/auth/logout', () => {
  beforeEach(() => jest.clearAllMocks());

  it('logs out successfully with valid refresh token', async () => {
    const userId = 'user-1';
    const refreshToken = makeRefreshToken(userId);
    mockDbUpdate(); // revoke in DB

    const req = makeRequest({ refreshToken });
    const res = await logoutHandler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toMatch(/logged out/i);
  });

  it('returns 422 when refreshToken is missing', async () => {
    const req = makeRequest({});
    const res = await logoutHandler(req);
    expect(res.status).toBe(422);
  });
});

// ─── REFRESH TOKEN ────────────────────────────────────────────────────────────

describe('POST /api/auth/refresh', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rotates tokens with valid refresh token', async () => {
    const userId = 'user-1';
    const refreshToken = makeRefreshToken(userId);

    // Mock getRefreshTokenUserId to find user
    mockDbSelect([{ userId }]);
    mockDbUpdate(); // revoke old
    mockDbInsert([]); // store new

    const req = makeRequest({ refreshToken });
    const res = await refreshHandler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBeDefined();
    expect(body.refreshToken).not.toBe(refreshToken); // rotated
  });

  it('returns 401 for invalid refresh token', async () => {
    const req = makeRequest({ refreshToken: 'invalid.token.here' });
    const res = await refreshHandler(req);
    expect(res.status).toBe(401);
  });

  it('returns 401 for revoked/invalid refresh token in DB', async () => {
    const userId = 'user-1';
    const refreshToken = makeRefreshToken(userId);
    mockDbSelect([]); // not found / revoked in DB

    const req = makeRequest({ refreshToken });
    const res = await refreshHandler(req);
    expect(res.status).toBe(401);
  });
});

// ─── 2FA SETUP ────────────────────────────────────────────────────────────────

describe('POST /api/auth/2fa/setup', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 without auth token', async () => {
    const req = makeRequest({});
    const res = await setup2faHandler(req);
    expect(res.status).toBe(401);
  });

  it('sets up 2FA for authenticated user', async () => {
    const userId = 'user-1';
    const token = makeAccessToken(userId);
    mockDbSelect([{ id: userId, email: 'test@example.com', totpSecret: null }]);
    mockDbUpdate();

    const req = makeAuthRequest({}, token);
    const res = await setup2faHandler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.secret).toBeDefined();
    expect(body.otpauthUrl).toBeDefined();
  });
});

// ─── 2FA VERIFY ───────────────────────────────────────────────────────────────

describe('POST /api/auth/2fa/verify', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 without auth token', async () => {
    const req = makeRequest({ code: '123456' });
    const res = await verify2faHandler(req);
    expect(res.status).toBe(401);
  });

  it('verifies valid TOTP code', async () => {
    (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);

    const userId = 'user-1';
    const token = makeAccessToken(userId);
    mockDbSelect([{ id: userId, totpSecret: 'TESTSECRETBASE32' }]);

    const req = makeAuthRequest({ code: '123456' }, token);
    const res = await verify2faHandler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toMatch(/verified/i);
  });

  it('returns 401 for invalid TOTP code', async () => {
    (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);

    const userId = 'user-1';
    const token = makeAccessToken(userId);
    mockDbSelect([{ id: userId, totpSecret: 'TESTSECRETBASE32' }]);

    const req = makeAuthRequest({ code: '000000' }, token);
    const res = await verify2faHandler(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when 2FA not set up', async () => {
    const userId = 'user-1';
    const token = makeAccessToken(userId);
    mockDbSelect([{ id: userId, totpSecret: null }]);

    const req = makeAuthRequest({ code: '123456' }, token);
    const res = await verify2faHandler(req);
    expect(res.status).toBe(400);
  });
});
