import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.EMAIL_FROM;
const fromName = process.env.EMAIL_FROM_NAME || 'Backr';

if (!apiKey) {
  console.error('❌ RESEND_API_KEY is missing');
  process.exit(1);
}

if (!fromEmail) {
  console.error('❌ EMAIL_FROM is missing');
  process.exit(1);
}

const toEmail = process.argv[2] || fromEmail;
const resend = new Resend(apiKey);

async function test() {
  console.log('--- Resend Diagnostic Test ---');
  console.log('From:', `${fromName} <${fromEmail}>`);
  console.log('To:', toEmail);
  console.log('API Key starts with:', apiKey!.substring(0, 10));

  try {
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: toEmail!, // Send to verified recipient or self
      subject: '🚀 Resend Diagnostic Test',
      text: 'If you see this, the Resend API successfully accepted the message.',
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
          <h2 style="color: #10b981;">Resend Integration Active</h2>
          <p>This is a diagnostic test from your local development environment.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 0.85rem; color: #666;">Status: <strong>SUCCESS</strong></p>
          <p style="font-size: 0.85rem; color: #666;">Provider: <strong>Resend SDK</strong></p>
        </div>
      `,
    });

    if (error) {
      console.error('❌ Resend Error:', error);
      process.exit(1);
    }

    console.log('✅ Resend Response Status: OK');
    console.log('✅ Message ID:', data?.id);
    console.log('\n--- SUCCESS ---');
    console.log('The API accepted the email. If it does not arrive in your inbox, check:');
    console.log('1. Your Resend Dashboard for delivery status.');
    console.log('2. Your Spam folder (especially if domain is unverified).');
    console.log('3. Ensure "noreply@backr.app" is verified in Resend.');
  } catch (error: any) {
    console.error('❌ Unexpected Error:', error.message);
  }
}

test();
