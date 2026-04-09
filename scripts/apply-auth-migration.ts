import 'dotenv/config';
import { Pool } from 'pg';

import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  console.log('Applying auth migration bypassing Drizzle specific roles...');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is missing');

  const pool = new Pool({ connectionString });

  try {
    const migrationPath = path.join(process.cwd(), 'src/db/migrations/0012_amusing_komodo.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');

    await pool.query(sqlContent);

    console.log('Migration applied successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigration();
