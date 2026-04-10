import Pusher from 'pusher-js';

let pusherClientInstance: Pusher | null = null;

/**
 * Returns a Pusher client instance, initialized only on the client-side.
 * Returns null during SSR/Build-time prerendering.
 */
export const getPusherClient = () => {
  if (typeof window === 'undefined') return null;

  if (!pusherClientInstance) {
    pusherClientInstance = new Pusher(
      process.env.NEXT_PUBLIC_PUSHER_KEY || '',
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1',
      }
    );
  }
  return pusherClientInstance;
};
