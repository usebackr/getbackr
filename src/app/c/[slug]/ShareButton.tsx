'use client';

import React, { useState } from 'react';

interface ShareButtonProps {
  title: string;
  text: string;
  url: string;
}

export default function ShareButton({ title, text, url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    // Generate full URL if missing domain
    const fullUrl = url.startsWith('http')
      ? url
      : typeof window !== 'undefined'
        ? `${window.location.origin}${url}`
        : url;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url: fullUrl,
        });
        return; // Success
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing natively:', err);
        }
      }
    }

    // Fallback to clipboard if navigator.share fails or isn't supported
    try {
      if (typeof window !== 'undefined') {
        await navigator.clipboard.writeText(fullUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Clipboard fallback failed', err);
    }
  };

  return (
    <button
      onClick={handleShare}
      style={{
        width: '100%',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        background: '#f8fafc',
        color: '#475569',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      {copied ? 'Link Copied to Clipboard!' : 'Share Campaign'}
    </button>
  );
}
