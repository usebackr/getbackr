import { db } from './src/lib/db';
import { sql } from 'drizzle-orm';

async function inspectSchema() {
  try {
    const result = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'contributions'
    `);
    console.log('Columns in contributions table:', JSON.stringify(result.rows, null, 2));
  } catch (err) {
    console.error('Error inspecting schema:', err);
  } finally {
    process.exit(0);
  }
}

inspectSchema();
