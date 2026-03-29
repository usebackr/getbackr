// import fetch from 'node-fetch'; // Next.js 14 / Node 18+ has native fetch
import crypto from 'crypto';

const WEBHOOK_URL = process.argv[2] || 'http://localhost:3000/api/payments/webhook';
const CAMPAIGN_ID = process.argv[3] || 'YOUR_CAMPAIGN_ID'; // Replace with a real campaign ID for local test
const SECRET = process.env.PAYSTACK_SECRET_KEY || 'sk_test_placeholder';

const payload = {
  event: 'charge.success',
  data: {
    id: 12345,
    domain: 'test',
    status: 'success',
    reference: `test-ref-${Date.now()}`,
    amount: 500000, // 5000 NGN
    currency: 'NGN',
    channel: 'card',
    customer: {
      email: 'tester@example.com'
    },
    metadata: {
      campaignId: CAMPAIGN_ID,
      backerName: 'Diagnostic Tester'
    }
  }
};

const body = JSON.stringify(payload);
const signature = crypto.createHmac('sha512', SECRET).update(body).digest('hex');

console.log(`Sending diagnostic webhook to ${WEBHOOK_URL}...`);
console.log(`Using Campaign ID: ${CAMPAIGN_ID}`);

fetch(WEBHOOK_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-paystack-signature': signature
  },
  body: body
})
.then(async res => {
  const text = await res.text();
  console.log(`Response Status: ${res.status}`);
  console.log(`Response Body: ${text}`);
})
.catch(err => {
  console.error('Fetch error:', err);
});
