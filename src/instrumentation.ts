export async function register() {
  // Backr Instrumentation: Removed legacy Redis background workers
  // Maintenance is now handled via the /api/cron endpoint for serverless compatibility.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('✅ Backr core services initialized (Serverless Mode)');
  }
}
