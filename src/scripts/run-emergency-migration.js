const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const connectionString = "postgresql://postgres.enlmurwayokqsrusxytu:11647Backr11647_@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

async function runMigration() {
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('--- Emergency Migration ---');
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected.');

    const sql = 'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "interests" jsonb DEFAULT \'[]\'::jsonb NOT NULL;';
    console.log('Executing SQL:', sql);
    
    await client.query(sql);
    console.log('SUCCESS: Column "interests" added to "users" table.');

  } catch (err) {
    console.error('ERROR during migration:', err.message);
    if (err.message.includes('already exists')) {
      console.log('Note: Column might already exist, which is fine.');
    } else {
      process.exit(1);
    }
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

runMigration();
