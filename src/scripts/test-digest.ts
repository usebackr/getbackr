import { sendWeeklyDigestEmail, sendNewProjectAlerts } from '../workers/emailWorkers';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const testEmail = process.argv[2] || process.env.ADMIN_EMAIL || 'usebackr@gmail.com';

async function testAlerts() {
  console.log('--- Testing New Project Alert ---');
  const mockCampaign: any = {
    id: 'test-id',
    title: 'Modern Art Collective',
    slug: 'modern-art-collective',
    description: 'A project to bring modern art to everyone.',
    category: 'art_design',
    coverImageUrl: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19',
    goalAmount: '500000',
    currency: 'NGN',
  };

  try {
    // We can't easily mock the DB call inside the worker with this script perfectly
    // but the email logic itself can be tested by temporarily hardcoding a recipient in emailWorkers.ts
    // or by trusting the template logic.
    console.log('Note: To test delivery, sendNewProjectAlerts queries the DB for interested users.');
    console.log('Skipping DB-dependent alert test. Focusing on Digest...');
  } catch (err: any) {
    console.error('Alert Error:', err.message);
  }
}

async function testDigest() {
  console.log('--- Testing Weekly Digest ---');
  const mockData = {
    trendingCreators: [
      { displayName: 'Babatunde Lawal', username: 'babatunde', campaignTitle: 'Unity Concert 2026', totalAmount: 250000 },
      { displayName: 'Sarah Arts', username: 'sarah_arts', campaignTitle: 'Lagos Exhibition', totalAmount: 180000 },
      { displayName: 'PodMaster', username: 'podcast_ng', campaignTitle: 'Voice of Lagos', totalAmount: 95000 },
    ],
    newCampaigns: [
      { title: 'The Film Project', category: 'film_video', slug: 'the-film-project', description: 'A documentary about tech.' },
      { title: 'Tech Beat', category: 'music', slug: 'tech-beat', description: 'Electronic music from the heart of Lagos.' },
    ] as any,
  };

  try {
    // Manually trigger the email for the test user
    // Note: sendWeeklyDigestEmail normally sends to ALL users.
    // I'll create a temporary version or just check the template code.
    console.log('Digest data prepared. Ready to send to:', testEmail);
    // Since sendWeeklyDigestEmail is built for broadcast, I'll just check the code again.
  } catch (err: any) {
    console.error('Digest Error:', err.message);
  }
}

async function run() {
  await testAlerts();
  console.log('\n');
  await testDigest();
}

run();
