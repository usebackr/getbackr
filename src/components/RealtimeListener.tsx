'use client';

import { useRealtimeUpdate } from '@/hooks/useRealtimeUpdate';
import { toast } from 'react-hot-toast'; // Assuming react-hot-toast is used, will check

export default function RealtimeListener({ campaignId, userId }: { campaignId?: string; userId?: string }) {
  useRealtimeUpdate({
    campaignId,
    userId,
    onDonation: (data) => {
      const message = data.campaignTitle 
        ? `New donation for "${data.campaignTitle}"!`
        : `New donation received!`;
      
      toast.success(
        (t) => (
          <span>
            <b>{data.backerName}</b> just donated <b>₦{data.amount.toLocaleString()}</b>{data.campaignTitle ? ` to ${data.campaignTitle}` : ''}!
          </span>
        ),
        { duration: 6000, icon: '🎉' }
      );
    },
  });

  return null;
}
