export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Skip workers if Redis is not configured (e.g. Vercel serverless)
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl || redisUrl === 'redis://localhost:6379') {
      console.log('⚠️  No Redis configured — background workers disabled (serverless mode)');
      return;
    }

    try {
      const { registerAllWorkers } = await import('./workers/index');
      console.log('🚀 Activating Backr Background Workers...');
      registerAllWorkers();
      console.log('✅ Email & Campaign workers are now live and listening!');
    } catch (err) {
      console.error('⚠️  Workers failed to start (non-fatal):', err);
    }
  }
}
