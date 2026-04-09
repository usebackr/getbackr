'use client';

import React from 'react';
import { BadgeCheck } from 'lucide-react';

interface VerifiedBadgeProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export default function VerifiedBadge({ 
  size = 20, 
  className = "", 
  showText = false 
}: VerifiedBadgeProps) {
  return (
    <div 
      className={`inline-flex items-center gap-1.5 ${className}`}
      title="Verified Creator"
    >
      <BadgeCheck 
        size={size} 
        fill="#3b82f6" 
        color="#ffffff" 
        strokeWidth={1.5}
        className="drop-shadow-sm"
      />
      {showText && (
        <span style={{ 
          fontSize: `${size * 0.7}px`, 
          fontWeight: 700, 
          color: '#3b82f6',
          textTransform: 'uppercase',
          letterSpacing: '0.02em'
        }}>
          Verified
        </span>
      )}
    </div>
  );
}
