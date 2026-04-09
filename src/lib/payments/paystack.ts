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
  subaccount?: string, // optional subaccount for split payments
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
      subaccount: subaccount || undefined,
      bearer: subaccount ? 'subaccount' : 'account', // subaccount pays fees if present
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
 * Creates a Subaccount on Paystack for split payments.
 */
export async function createSubaccount(
  businessName: string,
  settlementBank: string,
  accountNumber: string,
  percentageCharge: number = 5,
): Promise<string> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) throw new Error('PAYSTACK_SECRET_KEY is not configured');

  const response = await fetch(`${PAYSTACK_BASE_URL}/subaccount`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      business_name: businessName,
      settlement_bank: settlementBank,
      account_number: accountNumber,
      percentage_charge: percentageCharge,
    }),
  });

  const data = await response.json();
  if (!data.status) throw new Error(data.message);

  return data.data.subaccount_code;
}

/**
 * Creates a Transfer Recipient on Paystack.
 */
export async function createTransferRecipient(
  name: string,
  accountNumber: string,
  bankCode: string,
): Promise<string> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) throw new Error('PAYSTACK_SECRET_KEY is not configured');

  const response = await fetch(`${PAYSTACK_BASE_URL}/transferrecipient`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'nuban',
      name,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: 'NGN',
    }),
  });

  const data = await response.json();
  if (!data.status) throw new Error(data.message);

  return data.data.recipient_code;
}

/**
 * Initiates a Transfer from Backr's Paystack balance to a recipient.
 */
export async function initiateTransfer(
  amount: number,
  recipientCode: string,
  reason: string,
): Promise<{ status: string; transfer_code: string; message: string }> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) throw new Error('PAYSTACK_SECRET_KEY is not configured');

  const response = await fetch(`${PAYSTACK_BASE_URL}/transfer`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source: 'balance',
      amount: toSmallestUnit(amount),
      recipient: recipientCode,
      reason,
    }),
  });

  const data = await response.json();
  if (!data.status) throw new Error(data.message);

  return {
    status: data.data.status, // "otp", "success", "pending"
    transfer_code: data.data.transfer_code,
    message: data.message,
  };
}

/**
 * Finalizes a transfer that requires an OTP.
 */
export async function finalizeTransfer(
  transferCode: string,
  otp: string,
): Promise<{ status: boolean; message: string }> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) throw new Error('PAYSTACK_SECRET_KEY is not configured');

  const response = await fetch(`${PAYSTACK_BASE_URL}/transfer/finalize_transfer`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transfer_code: transferCode,
      otp,
    }),
  });

  const data = await response.json();
  if (!data.status) throw new Error(data.message);

  return {
    status: data.status,
    message: data.message,
  };
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

/**
 * Fetches the current balance of the Paystack account.
 * Specifically checks the NGN balance available for transfers.
 */
export async function getTransferBalance(): Promise<number> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) throw new Error('PAYSTACK_SECRET_KEY is not configured');

  const response = await fetch(`${PAYSTACK_BASE_URL}/balance`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });

  if (!response.ok) throw new Error('Failed to fetch balance from Paystack');

  const data = await response.json();
  if (!data.status) throw new Error(data.message);

  // Return NGN balance or 0 if not found
  const ngnBalance = data.data.find((b: any) => b.currency === 'NGN');
  return ngnBalance ? ngnBalance.balance / 100 : 0;
}
