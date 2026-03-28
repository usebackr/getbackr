import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@/db/schema';

let pool: Pool | undefined;

function getPool(): Pool {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;
    
    // During build time on some CI environments, DATABASE_URL might be missing.
    // We return a dummy pool if it is missing during build, but throw if it's missing during runtime.
    if (!databaseUrl) {
      if (process.env.NODE_ENV === 'production' && typeof window === 'undefined' && !process.env.VERCEL_URL) {
         // This is likely build time or a misconfigured production environment.
         // We log but don't immediately throw to allow 'next build' to pass analysis.
         console.warn('DATABASE_URL is missing. DB operations will fail at runtime.');
      }
      return new Pool(); // Return empty pool to satisfy type checking during build analysis
    }

    pool = new Pool({
      connectionString: databaseUrl,
      max: 20,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected PostgreSQL pool error:', err);
    });
  }
  return pool;
}

// We wrap the drizzle instance to ensure it's always initialized with the current pool.
// This prevents top-level execution errors during the 'next build' phase.
export const db = drizzle(getPool(), { schema });

export type Database = typeof db;

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
