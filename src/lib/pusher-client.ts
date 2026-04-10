import PusherClient from 'pusher-js';

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
