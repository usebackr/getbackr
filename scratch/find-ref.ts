import { db } from '../src/lib/db';
import { contributions } from '../src/db/schema/contributions';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

// Manual check script
async function findPayment(ref: string) {
  console.log(`Searching for reference: ${ref}`);
  
  const results = await db.select().from(contributions).where(eq(contributions.paymentReference, ref));
  
  if (results.length === 0) {
    console.log("❌ Reference NOT found in contributions table.");
  } else {
    console.log("✅ Found reference:", JSON.stringify(results[0], null, 2));
  }
}

findPayment('uf6013e3kc').then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
