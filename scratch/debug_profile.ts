import { db } from './src/lib/db';
import { users } from './src/db/schema/users';
import { eq, or, sql } from 'drizzle-orm';

async function testQuery() {
  const identifier = 'justdabiri';
  const clean = identifier.replace('@', '');
  
  console.log('Testing identifier:', identifier);
  console.log('Clean identifier:', clean);

  const results = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName
    })
    .from(users)
    .where(
      or(
        eq(users.username, clean),
        sql`LOWER(${users.username}) = LOWER(${clean})`
      )
    );

  console.log('Direct Results:', results);

  const allWithUsernames = await db
    .select({ username: users.username })
    .from(users)
    .where(sql`${users.username} IS NOT NULL`)
    .limit(10);
    
  console.log('Sample Usernames in DB:', allWithUsernames);
}

testQuery().catch(console.error);
