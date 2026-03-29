import sgMail from '@sendgrid/mail';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const apiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.EMAIL_FROM;
const fromName = process.env.EMAIL_FROM_NAME || 'Backr';

if (!apiKey) {
  console.error('❌ SENDGRID_API_KEY is missing');
  process.exit(1);
}

sgMail.setApiKey(apiKey);

async function test() {
  console.log('--- SendGrid Diagnostic Test ---');
  console.log('From:', fromEmail);
  console.log('API Key starts with:', apiKey.substring(0, 10));

  const msg = {
    to: fromEmail, // Send to self for testing
    from: {
      email: fromEmail as string,
      name: fromName,
    },
    subject: '🚨 SendGrid Diagnostic Test',
    text: 'If you see this, the SendGrid API successfully accepted the message.',
    html: '<strong>If you see this, the SendGrid API successfully accepted the message.</strong>',
  };

  try {
    const [response] = await sgMail.send(msg);
    console.log('✅ SendGrid Response Status:', response.statusCode);
    console.log('✅ SendGrid Headers:', JSON.stringify(response.headers, null, 2));
    console.log('\n--- SUCCESS ---');
    console.log('The API accepted the email. If it does not arrive in your inbox/spam, check your SendGrid Activity feed for a "Dropped" or "Deferred" status.');
  } catch (error: any) {
    console.error('❌ SendGrid Error:', error.message);
    if (error.response) {
      console.error('❌ Body:', JSON.stringify(error.response.body, null, 2));
    }
  }
}

test();
