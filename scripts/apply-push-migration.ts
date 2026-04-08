import 'dotenv/config';
import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function main() {
  const fs = require('fs');
  const path = require('path');
  const migrationPath = path.join(process.cwd(), 'src/db/migrations/0012_amusing_komodo.sql');
  const sqlContent = fs.readFileSync(migrationPath, 'utf8');
  await db.execute(sql.raw(sqlContent));

  console.log("Migration applied successfully.");
}
main().then(() => process.exit(0)).catch(console.error);
