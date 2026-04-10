import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

/**
 * Server-side Pusher instance for triggering events.
 * Requires: PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER
 */
let pusherServerInstance: PusherServer | null = null;

export const getPusherServer = () => {
  if (!pusherServerInstance) {
    pusherServerInstance = new PusherServer({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.PUSHER_CLUSTER!,
      useTLS: true,
    });
  }
  return pusherServerInstance;
};

/**
 * Client-side Pusher instance for listening to events.
 * Requires: NEXT_PUBLIC_PUSHER_KEY, NEXT_PUBLIC_PUSHER_CLUSTER
 */
export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY || '',
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1',
  }
);
