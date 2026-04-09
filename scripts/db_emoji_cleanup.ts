import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { campaigns } from '../src/db/schema/campaigns';
import { campaignUpdates } from '../src/db/schema/campaignUpdates';
import { eq } from 'drizzle-orm';

dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set in .env.local');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const db = drizzle(pool);

// Broad emoji regex: matches most common pictographs and symbols
// Source: https://stackoverflow.com/questions/10992921/how-to-remove-emojis-from-a-string-in-javascript
const emojiRegex =
  /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F251}\u{1F004}\u{1F18E}\u{1F191}-\u{1F19A}\u{1F300}-\u{1F320}\u{1F321}-\u{1F335}\u{1F336}-\u{1F37C}\u{1F37D}-\u{1F393}\u{1F394}-\u{1F39B}\u{1F39C}-\u{1F39D}\u{1F39E}-\u{1F3A0}\u{1F3A1}-\u{1F3F0}\u{1F3F1}-\u{1F3F7}\u{1F3F8}-\u{1F3FA}\u{1F3FB}-\u{1F3FF}\u{1F400}-\u{1F43E}\u{1F43F}\u{1F440}\u{1F441}\u{1F442}-\u{1F4F7}\u{1F4F8}\u{1F4F9}-\u{1F4FC}\u{1F4FD}-\u{1F4FF}\u{1F500}-\u{1F53D}\u{1F53E}-\u{1F54A}\u{1F54B}-\u{1F54E}\u{1F54F}-\u{1F550}\u{1F551}-\u{1F567}\u{1F568}-\u{1F579}\u{1F57A}\u{1F57B}-\u{1F5A3}\u{1F5A4}\u{1F5A5}-\u{1F5FA}\u{1F5FB}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6C5}\u{1F6C6}-\u{1F6CF}\u{1F6D0}-\u{1F6D2}\u{1F6D3}-\u{1F6D4}\u{1F6D5}\u{1F6D6}-\u{1F6D7}\u{1F6E0}-\u{1F6EC}\u{1F6ED}-\u{1F6EF}\u{1F6F0}-\u{1F6F3}\u{1F6F4}-\u{1F6F6}\u{1F6F7}-\u{1F6F8}\u{1F6F9}-\u{1F6FA}\u{1F6FB}-\u{1F6FC}\u{1F700}-\u{1F773}\u{1F780}-\u{1F7D4}\u{1F7E0}-\u{1F7EB}\u{1F800}-\u{1F80B}\u{1F810}-\u{1F847}\u{1F850}-\u{1F859}\u{1F860}-\u{1F887}\u{1F890}-\u{1F8AD}\u{1F900}-\u{1F90B}\u{1F90C}-\u{1F93A}\u{1F93C}-\u{1F945}\u{1F947}-\u{1F978}\u{1F97A}-\u{1F9CB}\u{1F9CD}-\u{1F9FF}\u{1FA00}-\u{1FA53}\u{1FA60}-\u{1FA6D}\u{1FA70}-\u{1FA74}\u{1FA78}-\u{1FA7A}\u{1FA80}-\u{1FA86}\u{1FA90}-\u{1FAA8}\u{1FAB0}-\u{1FAB6}\u{1FAC0}-\u{1FAC2}\u{1FAD0}-\u{1FAD6}\u{1FB00}-\u{1FB92}\u{1FB94}-\u{1FBCA}]+/gu;

function cleanString(str: string | null | undefined): string {
  if (!str) return '';
  return str.replace(emojiRegex, '').trim();
}

async function runCleanup() {
  console.log('🚀 Starting Database Emoji Sweep...');

  // 1. Clean Campaigns
  const allCampaigns = await db.select().from(campaigns);
  console.log(`Found ${allCampaigns.length} campaigns. Scanning...`);

  for (const camp of allCampaigns) {
    const cleanTitle = cleanString(camp.title);
    const cleanDesc = cleanString(camp.description);

    if (cleanTitle !== camp.title || cleanDesc !== camp.description) {
      console.log(`Cleaning campaign: ${camp.title} -> ${cleanTitle}`);
      await db
        .update(campaigns)
        .set({ title: cleanTitle, description: cleanDesc })
        .where(eq(campaigns.id, camp.id));
    }
  }

  // 2. Clean Updates
  const allUpdates = await db.select().from(campaignUpdates);
  console.log(`Found ${allUpdates.length} updates. Scanning...`);

  for (const update of allUpdates) {
    const cleanTitle = cleanString(update.title);
    const cleanBody = cleanString(update.body);

    if (cleanTitle !== update.title || cleanBody !== update.body) {
      console.log(`Cleaning update: ${update.title} -> ${cleanTitle}`);
      await db
        .update(campaignUpdates)
        .set({ title: cleanTitle, body: cleanBody })
        .where(eq(campaignUpdates.id, update.id));
    }
  }

  console.log('✅ Database Emoji Sweep Complete.');
  process.exit(0);
}

runCleanup().catch((err) => {
  console.error('❌ Cleanup failed:', err);
  process.exit(1);
});
