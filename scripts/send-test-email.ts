import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { sendEmail } from '../src/workers/emailWorkers';

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error(
      'Please provide an email address: npx tsx scripts/send-test-email.ts your@email.com',
    );
    process.exit(1);
  }

  console.log(`🚀 Sending test "Welcome Email" to ${email} via Resend...`);
  console.log(`🔗 Domain: findbackr.com.ng`);
  console.log(`📧 From: ${process.env.EMAIL_FROM || 'notifications@send.findbackr.com.ng'}`);

  try {
    const result = await sendEmail({
      type: 'welcome_email',
      email: email,
      displayName: 'Test User',
    });

    if (result.sent) {
      console.log('✅ Test email SENT successfully! Check your inbox (and spam folder).');
      console.log('Message ID:', result.messageId);
    } else {
      console.error('❌ Failed to send:', result.error);
    }
  } catch (err) {
    console.error('❌ Error in test script:', err);
  }
}

main();
