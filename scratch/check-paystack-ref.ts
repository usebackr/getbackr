import { verifyTransaction } from '../src/lib/payments/paystack';

async function testVerification(ref: string) {
  console.log(`Verifying reference: ${ref}`);
  try {
    const data = await verifyTransaction(ref);
    console.log("Paystack Response Data:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Verification failed:", err);
  }
}

testVerification('uf6013e3kc').then(() => process.exit(0));
