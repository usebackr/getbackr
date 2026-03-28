import crypto from 'crypto';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

export interface InitializeTransactionResult {
  authorization_url: string;
  access_code: string;
  reference: string;
}

/**
 * Converts an amount to the smallest currency unit (kobo, cents, etc.)
 * Paystack expects amounts in kobo (multiply by 100).
 */
export function toSmallestUnit(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Initializes a Paystack transaction and returns the checkout URL.
 */
export async function initializeTransaction(
  email: string,
  amount: number, // in major currency unit (e.g. NGN, not kobo)
  currency: string,
  metadata: Record<string, unknown>,
  callbackUrl: string,
): Promise<InitializeTransactionResult> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured');
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: toSmallestUnit(amount),
      currency: currency.toUpperCase(),
      metadata,
      callback_url: callbackUrl,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Paystack transaction initialization failed: ${response.status} ${errorBody}`);
  }

  const data = (await response.json()) as {
    status: boolean;
    message: string;
    data: InitializeTransactionResult;
  };

  if (!data.status) {
    throw new Error(`Paystack error: ${data.message}`);
  }

  return data.data;
}

/**
 * Verifies a Paystack webhook signature using HMAC-SHA512.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string,
): boolean {
  const expectedSignature = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');

  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  const receivedBuffer = Buffer.from(signature, 'hex');

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

export interface PaystackBank {
  name: string;
  code: string;
  id: number;
}

/**
 * Lists available banks in Nigeria from Paystack.
 */
export async function listBanks(): Promise<PaystackBank[]> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) throw new Error('PAYSTACK_SECRET_KEY is not configured');

  const response = await fetch(`${PAYSTACK_BASE_URL}/bank?country=nigeria`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });

  if (!response.ok) throw new Error('Failed to fetch banks from Paystack');

  const data = await response.json();
  if (!data.status) throw new Error(data.message);

  return data.data;
}

/**
 * Resolves an account number to an account name using Paystack.
 */
export async function resolveAccountNumber(
  accountNumber: string,
  bankCode: string,
): Promise<string> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) throw new Error('PAYSTACK_SECRET_KEY is not configured');

  const response = await fetch(
    `${PAYSTACK_BASE_URL}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
    {
      headers: { Authorization: `Bearer ${secretKey}` },
    },
  );

  if (!response.ok) {
    if (response.status === 422) {
      throw new Error('Could not resolve account number. Please check the details.');
    }
    throw new Error('Failed to resolve account number');
  }

  const data = await response.json();
  if (!data.status) throw new Error(data.message);

  return data.data.account_name;
}
