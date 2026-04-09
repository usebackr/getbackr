'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Settings } from 'lucide-react';

interface CampaignActionsProps {
  campaign: any;
  onEnd: (id: string) => void;
}

export default function CampaignActions({ campaign, onEnd }: CampaignActionsProps) {
  const router = useRouter();
  const isDraft = campaign.status?.toLowerCase() === 'draft';

  if (isDraft) return null;

  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        marginTop: '12px',
        flexWrap: 'wrap'
      }}
    >
      <button
        onClick={() => router.push(`/dashboard/campaigns/${campaign.id}/manage`)}
        className="btn-primary"
        style={{
          flex: '1 1 100%',
          padding: '14px',
          fontSize: '0.95rem',
          background: '#0f172a',
          color: '#fff',
          border: 'none',
          fontWeight: 800,
          borderRadius: '14px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '8px'
        }}
      >
        <Settings size={18} /> Manage Project
      </button>

      {campaign.status?.toLowerCase() === 'active' && (
        <button
          onClick={() => onEnd(campaign.id)}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '14px',
            border: '1px solid #fee2e2',
            background: '#fff',
            color: '#ef4444',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          End Campaign
        </button>
      )}
    </div>
  );
}
