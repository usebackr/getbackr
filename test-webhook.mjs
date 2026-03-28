import crypto from 'crypto';


const webhookSecret = process.env.PAYSTACK_SECRET_KEY;
if (!webhookSecret) {
  console.error("Missing PAYSTACK_SECRET_KEY in .env.local");
  process.exit(1);
}

const payload = {
  event: 'charge.success',
  data: {
    reference: `test-ref-${Date.now()}`,
    amount: 1000000, 
    currency: 'NGN',
    channel: 'paystack',
    customer: {
      email: 'tester@backr.com'
    },
    metadata: {
      campaignId: '52650fee-dc6c-4b64-a43a-003cd6a18a65',
      backerId: null
    }
  }
};

const payloadString = JSON.stringify(payload);
const hash = crypto.createHmac('sha512', webhookSecret).update(payloadString).digest('hex');

async function test() {
  console.log("Sending webhook request...");
  try {
    const response = await fetch('http://localhost:3000/api/payments/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-paystack-signature': hash
      },
      body: payloadString
    });

    const result = await response.json().catch(() => ({}));
    console.log("Response Status:", response.status);
    console.log("Response Body:", result);
  } catch (error) {
    console.error("Error:", error);
  }
}

test();
