import 'dotenv/config';
import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const migrationPath = path.join(process.cwd(), 'src/db/migrations/0012_amusing_komodo.sql');
  const sqlContent = fs.readFileSync(migrationPath, 'utf8');
  await db.execute(sql.raw(sqlContent));

  console.log('Migration applied successfully.');
}

main()
  .then(() => process.exit(0))
  .catch(console.error);
