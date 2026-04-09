import 'dotenv/config';
import { db } from '../src/lib/db';
import { users } from '../src/db/schema/users';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('Scanning for legacy users without email verification...');

  const unverifiedUsers = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.emailVerified, false));

  if (unverifiedUsers.length === 0) {
    console.log('No unverified users found. Everyone is good to go!');
    return;
  }

  console.log(
    `Found ${unverifiedUsers.length} unverified existing accounts. Applying verification...`,
  );

  let verifiedCount = 0;

  for (const u of unverifiedUsers) {
    try {
      await db.update(users).set({ emailVerified: true }).where(eq(users.id, u.id));
      verifiedCount++;
    } catch (e) {
      console.error(`Failed to verify ${u.email}`, e);
    }
  }

  console.log(`Successfully verified ${verifiedCount} legacy accounts.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
