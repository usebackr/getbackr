'use client';

import { useEffect } from 'react';
import { getPusherClient } from '@/lib/pusher-client';
import { useRouter } from 'next/navigation';

interface RealtimeUpdateOptions {
  campaignId?: string;
  userId?: string;
  onDonation?: (data: { backerName: string; amount: number; totalRaised: number; campaignTitle?: string }) => void;
}

/**
 * Custom hook to listen for real-time campaign updates (donations).
 * When a donation is received, it triggers a router refresh and an optional callback.
 */
export function useRealtimeUpdate({ campaignId, userId, onDonation }: RealtimeUpdateOptions) {
  const router = useRouter();

  useEffect(() => {
    if (!campaignId && !userId) return;

    const pusher = getPusherClient();
    if (!pusher) return; // Not in browser

    const channelName = userId ? `user-${userId}` : `campaign-${campaignId}`;
    const channel = pusher.subscribe(channelName);

    channel.bind('donation-received', (data: any) => {
      console.log(`[Realtime] Donation received:`, data);
      
      router.refresh();

      if (onDonation) {
        onDonation(data);
      }
    });

    return () => {
      pusher.unsubscribe(channelName);
      channel.unbind_all();
    };
  }, [campaignId, userId, onDonation, router]);
}
