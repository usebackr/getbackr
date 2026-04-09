import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    console.log('--- Starting DB Patch for contributions table ---');
    
    // List of columns to ensure exist
    const patches = [
      sql`ALTER TABLE contributions ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(15,2) DEFAULT '0'`,
      sql`ALTER TABLE contributions ADD COLUMN IF NOT EXISTS net_amount NUMERIC(15,2) DEFAULT '0'`,
      sql`ALTER TABLE contributions ADD COLUMN IF NOT EXISTS referral_source VARCHAR(50)`,
      sql`ALTER TABLE contributions ADD COLUMN IF NOT EXISTS backer_name VARCHAR(255)`,
      sql`ALTER TABLE contributions ADD COLUMN IF NOT EXISTS message VARCHAR(500)`,
      sql`ALTER TABLE contributions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50)`,
    ];

    const results = [];
    const patchNames = [
      'Add platform_fee',
      'Add net_amount',
      'Add referral_source',
      'Add backer_name',
      'Add message',
      'Add payment_method',
    ];

    for (let i = 0; i < patches.length; i++) {
      try {
        await db.execute(patches[i]);
        results.push({ patch: patchNames[i], status: 'success' });
      } catch (err: any) {
        results.push({ patch: patchNames[i], status: 'error', error: err.message });
      }
    }

    return NextResponse.json({
      message: 'DB Patch process completed.',
      results
    });
  } catch (error: any) {
    console.error('DB Patch API error:', error);
    return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
}
