'use client';

import React, { useEffect, useState } from 'react';

interface Dataset {
  label: string;
  data: number[];
  color: string;
}

interface AnalyticsData {
  labels: string[];
  datasets: Dataset[];
}

export function GrowthChart() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/analytics/growth');
        if (!res.ok) throw new Error('Failed to fetch analytics');
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>Loading analytics...</div>;
  if (error) return <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>Error: {error}</div>;
  if (!data || data.labels.length === 0) return <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No data available for the last 30 days.</div>;

  const width = 800;
  const height = 300;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const maxValue = Math.max(...data.datasets.flatMap(d => d.data), 10);
  
  const getX = (index: number) => padding + (index / (data.labels.length - 1)) * chartWidth;
  const getY = (value: number) => height - padding - (value / maxValue) * chartHeight;

  return (
    <div style={{ background: '#ffffff', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Platform Growth</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Last 30 days of platform activity</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          {data.datasets.map((ds) => (
            <div key={ds.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: ds.color }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>{ds.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
          {/* Y-axis grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p) => (
            <g key={p}>
              <line 
                x1={padding} 
                y1={height - padding - p * chartHeight} 
                x2={width - padding} 
                y2={height - padding - p * chartHeight} 
                stroke="#f1f5f9" 
                strokeWidth="1" 
              />
              <text 
                x={padding - 10} 
                y={height - padding - p * chartHeight + 4} 
                textAnchor="end" 
                style={{ fontSize: '10px', fill: '#94a3b8', fontWeight: 600 }}
              >
                {Math.round(p * maxValue)}
              </text>
            </g>
          ))}

          {/* Datasets */}
          {data.datasets.map((ds) => {
            const points = ds.data.map((val, i) => `${getX(i)},${getY(val)}`).join(' ');
            return (
              <g key={ds.label}>
                {/* Area under line */}
                <path
                  d={`M ${getX(0)},${height - padding} ${points} L ${getX(ds.data.length - 1)},${height - padding} Z`}
                  fill={ds.color}
                  fillOpacity="0.05"
                />
                {/* Line */}
                <polyline
                  points={points}
                  fill="none"
                  stroke={ds.color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ transition: 'all 0.3s ease' }}
                />
                {/* Points */}
                {ds.data.map((val, i) => (
                  <circle
                    key={i}
                    cx={getX(i)}
                    cy={getY(val)}
                    r="3"
                    fill="#fff"
                    stroke={ds.color}
                    strokeWidth="2"
                    style={{ transition: 'all 0.3s ease' }}
                  />
                ))}
              </g>
            );
          })}

          {/* X-axis labels (subset) */}
          {data.labels.map((label, i) => {
            if (i % 5 !== 0 && i !== data.labels.length - 1) return null;
            return (
              <text
                key={i}
                x={getX(i)}
                y={height - padding + 20}
                textAnchor="middle"
                style={{ fontSize: '10px', fill: '#94a3b8', fontWeight: 600 }}
              >
                {new Date(label).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
