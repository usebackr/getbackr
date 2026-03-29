'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function PublicEmailPreviewPage() {
  const [activeTemplate, setActiveTemplate] = useState<'donor' | 'creator'>('donor');

  const BRAND_COLOR = '#10b981';
  const BG_COLOR = '#f1f5f9';
  const CARD_BG = '#ffffff';

  const emailWrapperStyle = {
    backgroundColor: BG_COLOR,
    padding: '40px 20px',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    color: '#0f172a',
    lineHeight: '1.6',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center'
  };

  const emailCardStyle = {
    maxWidth: '540px',
    width: '100%',
    margin: '0 auto',
    backgroundColor: CARD_BG,
    borderRadius: '24px',
    padding: '48px 32px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    border: '1px solid #e2e8f0',
  };

  const hrStyle = { border: 'none', borderTop: '1px solid #f1f5f9', margin: '24px 0' };

  const btnStyle = {
    display: 'inline-block',
    padding: '14px 28px',
    background: BRAND_COLOR,
    color: 'white',
    textDecoration: 'none',
    borderRadius: '12px',
    fontWeight: '700',
    fontSize: '1rem',
    border: 'none',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
    cursor: 'pointer'
  };

  return (
    <div style={emailWrapperStyle}>
      <header style={{ 
        maxWidth: '540px', width: '100%', marginBottom: '40px', 
        display: 'flex', flexDirection: 'column', gap: '24px' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>Email Visualizer</h1>
          <Link href="/" style={{ color: BRAND_COLOR, fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem' }}>← Back to site</Link>
        </div>
        
        <div style={{ 
          display: 'flex', gap: '4px', background: '#f1f5f9', padding: '4px', 
          borderRadius: '14px', border: '1px solid #e2e8f0' 
        }}>
          <button 
            type="button"
            onClick={(e) => { e.preventDefault(); setActiveTemplate('donor'); }}
            style={{ 
              flex: 1, padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: activeTemplate === 'donor' ? 'white' : 'transparent',
              fontWeight: 700, color: activeTemplate === 'donor' ? BRAND_COLOR : '#64748b',
              boxShadow: activeTemplate === 'donor' ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            Donor Receipt
          </button>
          <button 
            type="button"
            onClick={(e) => { e.preventDefault(); setActiveTemplate('creator'); }}
            style={{ 
              flex: 1, padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: activeTemplate === 'creator' ? 'white' : 'transparent',
              fontWeight: 700, color: activeTemplate === 'creator' ? BRAND_COLOR : '#64748b',
              boxShadow: activeTemplate === 'creator' ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            Creator Alert
          </button>
        </div>
      </header>

      {activeTemplate === 'donor' ? (
        <div style={emailCardStyle}>
          <p style={{ fontSize: '1.1rem', marginBottom: '24px' }}>Hi <strong>Sarah Johnson</strong>,</p>
          <p>Thank you for supporting <strong>"Solar for Schools Initiative"</strong>.</p>
          <p>Your contribution has been successfully received.</p>
          
          <div style={{ margin: '32px 0', padding: '24px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: '0 0 12px 0', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>TRANSACTION DETAILS</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Amount</span>
              <span style={{ fontWeight: 800, color: BRAND_COLOR }}>₦25,000.00</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Date</span>
              <span>March 29, 2026</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Reference</span>
              <code style={{ fontSize: '0.85rem' }}>PAY-7x9k2m4L0p</code>
            </div>
          </div>

          <p>You’re now part of this project. You can follow its progress, updates, and how funds are used.</p>
          
          <div style={{ textAlign: 'center', margin: '40px 0' }}>
            <button style={btnStyle}>View campaign progress ↗</button>
          </div>

          <p style={{ fontSize: '0.9rem', color: '#64748b' }}>Creators on Backr share regular updates so you can stay informed as the project develops.</p>
          <p style={{ fontSize: '0.9rem', color: '#64748b' }}>Thanks again for your support.</p>
          <p style={{ fontWeight: 800, color: '#0f172a', marginTop: '32px' }}>— Backr Team</p>
        </div>
      ) : (
        <div style={emailCardStyle}>
          <p style={{ fontSize: '1.1rem', marginBottom: '24px' }}>Hi <strong>Tunde</strong>,</p>
          <p>You just received a new contribution for your campaign:</p>
          <p style={{ fontSize: '1.25rem', fontWeight: 800, margin: '16px 0', color: BRAND_COLOR }}>"Solar for Schools Initiative"</p>
          
          <div style={{ margin: '32px 0', padding: '24px', background: '#fdf2f2', borderLeft: `6px solid ${BRAND_COLOR}`, borderRadius: '0 16px 16px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: '#64748b' }}>Amount</span>
              <span style={{ fontWeight: 800 }}>₦25,000.00</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: '#64748b' }}>From</span>
              <span style={{ fontWeight: 700 }}>Sarah Johnson</span>
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <p style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>CAMPAIGN REACH</p>
            <div style={{ background: '#e2e8f0', height: '12px', borderRadius: '6px', marginBottom: '8px', overflow: 'hidden' }}>
              <div style={{ background: BRAND_COLOR, width: '37%', height: '100%' }}></div>
            </div>
            <p><strong>₦185,000 raised</strong> of ₦500,000 goal</p>
          </div>

          <p><strong>What to do next:</strong></p>
          <ul style={{ paddingLeft: '20px', color: '#475569', marginBottom: '32px' }}>
            <li style={{ marginBottom: '8px' }}>Share an update with your supporters</li>
            <li style={{ marginBottom: '8px' }}>Log how funds are being used</li>
          </ul>

          <div style={{ textAlign: 'center' }}>
            <button style={btnStyle}>Open creator dashboard</button>
          </div>
          
          <p style={{ fontWeight: 800, color: '#0f172a', marginTop: '40px' }}>— Backr Team</p>
        </div>
      )}
      
      <footer style={{ marginTop: '40px', color: '#94a3b8', fontSize: '0.8rem', textAlign: 'center' }}>
        Rendering pixel-perfect emails for <strong>Backr.app</strong> 🚀
      </footer>
    </div>
  );
}
