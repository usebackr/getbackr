export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { registerAllWorkers } = await import('./workers/index');
    
    console.log('🚀 Activating Backr Background Workers...');
    registerAllWorkers();
    console.log('✅ Email & Campaign workers are now live and listening!');
  }
}
