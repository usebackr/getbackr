'use client';

import React from 'react';
import { ExternalLink, Search, Copy } from 'lucide-react';

interface ProjectTableProps {
  projects: any[];
}

const tableHeaderStyle = {
  fontSize: '0.75rem',
  fontWeight: 800,
  color: '#64748b',
  padding: '12px 8px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px'
};

export function CampaignTable({ projects }: ProjectTableProps) {
  const [filter, setFilter] = React.useState('');

  const filteredProjects = projects.filter(p => 
    p.title?.toLowerCase().includes(filter.toLowerCase()) ||
    p.creatorName?.toLowerCase().includes(filter.toLowerCase()) ||
    p.slug?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div 
      style={{ 
        background: '#fff', 
        padding: '32px', 
        borderRadius: '16px', 
        border: '1px solid #e2e8f0', 
        marginBottom: '48px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', marginBottom: '4px' }}>
            Platform Campaigns
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Management overview of all {projects.length} active and closed projects.
          </p>
        </div>
        <div style={{ padding: '8px 16px', background: '#f8fafc', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #e2e8f0' }}>
          <Search size={16} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Filter projects..." 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ background: 'none', border: 'none', outline: 'none', fontSize: '0.85rem', width: '200px' }}
          />
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
              <th style={{ ...tableHeaderStyle, textAlign: 'left' }}>Campaign</th>
              <th style={{ ...tableHeaderStyle, textAlign: 'left' }}>Creator</th>
              <th style={{ ...tableHeaderStyle, textAlign: 'left' }}>Raised / Goal</th>
              <th style={{ ...tableHeaderStyle, textAlign: 'left' }}>Status</th>
              <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Internal ID</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.map((p: any) => {
              const pct = Math.min(Math.round((Number(p.totalRaised || 0) / Number(p.goalAmount || 1)) * 100), 100);
              return (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 8px' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {p.title}
                      <a href={`/c/${p.slug}`} target="_blank" rel="noreferrer">
                        <ExternalLink size={12} color="#94a3b8" />
                      </a>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                      /c/{p.slug}
                    </div>
                  </td>
                  <td style={{ padding: '16px 8px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{p.creatorName || 'Unknown'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{p.creatorEmail || 'No email'}</div>
                  </td>
                  <td style={{ padding: '16px 8px' }}>
                    <div style={{ marginBottom: '6px', fontSize: '0.85rem', fontWeight: 800 }}>
                      ₦{Number(p.totalRaised || 0).toLocaleString()} <span style={{ color: '#94a3b8', fontWeight: 500 }}>/ ₦{Number(p.goalAmount).toLocaleString()}</span>
                    </div>
                    <div style={{ width: '120px', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#10b981' }} />
                    </div>
                  </td>
                  <td style={{ padding: '16px 8px' }}>
                    <StatusBadge 
                      label={p.status?.toUpperCase() || 'UNKNOWN'} 
                      active={p.status === 'active'} 
                      color={p.status === 'active' ? '#10b981' : p.status === 'closed' ? '#ef4444' : '#f59e0b'} 
                    />
                  </td>
                  <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <code style={{ fontSize: '0.75rem', background: '#f8fafc', padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        {p.id ? `${p.id.slice(0, 8)}...` : 'N/A'}
                      </code>
                      <button 
                        onClick={() => {
                          if (p.id) {
                            navigator.clipboard.writeText(p.id);
                            alert('Project UUID copied to clipboard!');
                          }
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
                      >
                        <Copy size={14} color="#64748b" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ label, active, color }: any) {
  return (
    <span
      style={{
        fontSize: '0.65rem',
        fontWeight: 900,
        padding: '4px 8px',
        borderRadius: '6px',
        background: active ? `${color}20` : '#f1f5f9',
        color: active ? color : '#94a3b8',
        border: active ? `1px solid ${color}40` : '1px solid #e2e8f0',
      }}
    >
      {label}
    </span>
  );
}
