'use client';

import { useEffect } from 'react';
import { pusherClient } from '@/lib/pusher';
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

    const channelName = userId ? `user-${userId}` : `campaign-${campaignId}`;
    const channel = pusherClient.subscribe(channelName);

    channel.bind('donation-received', (data: any) => {
      console.log(`[Realtime] Donation received for campaign ${campaignId}:`, data);
      
      // 1. Refresh the Next.js router to pull fresh server data (e.g. goal progress)
      router.refresh();

      // 2. Trigger optional callback (for toasts or local state)
      if (onDonation) {
        onDonation(data);
      }
    });

    return () => {
      pusherClient.unsubscribe(channelName);
      channel.unbind_all();
    };
  }, [campaignId, onDonation, router]);
}
