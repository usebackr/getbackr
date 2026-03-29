import sgMail from '@sendgrid/mail';
import * as dotenv from 'dotenv';
import path from 'path';

// Manual loading to verify environment
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const key = process.env.SENDGRID_API_KEY;
const from = process.env.EMAIL_FROM;

console.log('--- SendGrid Diagnostics ---');
console.log('SENDGRID_API_KEY Found:', !!key);
if (key) {
  console.log('Key Format:', key.startsWith('SG.') ? 'Valid (Starts with SG.)' : 'Unexpected Format');
  console.log('Key Length:', key.length);
}
console.log('EMAIL_FROM:', from || 'NOT SET');
console.log('---------------------------');

if (key) {
  try {
    sgMail.setApiKey(key);
    console.log('SendGrid SDK Initialised successfully with key.');
  } catch (err) {
    console.error('SendGrid Initialisation Error:', err);
  }
} else {
  console.error('CRITICAL: SENDGRID_API_KEY is missing from environment.');
}
