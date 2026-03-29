'use client';

import React from 'react';

export default function Hero() {
  return (
    <section
      className="hero-section"
      style={{
        position: 'relative',
        padding: 'clamp(100px, 15vw, 160px) 24px',
        textAlign: 'center',
        background: '#ffffff',
      }}
    >
      <div className="container" style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto' }}>
        <h1
          style={{
            fontSize: 'clamp(2.8rem, 10vw, 5.5rem)',
            lineHeight: 1.1,
            marginBottom: '28px',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            color: '#0f172a',
          }}
        >
          Funding that is <br />
          <span className="text-gradient">built on Trust.</span>
        </h1>
        <p
          style={{
            fontSize: 'clamp(1.1rem, 2vw, 1.25rem)',
            color: '#475569',
            maxWidth: '640px',
            margin: '0 auto 48px',
            lineHeight: 1.6,
            fontWeight: 500,
          }}
        >
          The first crowdfunding platform designed for the Next Generation of African creators. 
          Raise funds and build radical trust with your community through public spending logs.
        </p>
        
        <div
          style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            marginBottom: '80px',
            flexWrap: 'wrap',
          }}
        >
          <a
            href="/signup"
            className="btn-primary"
            style={{ padding: '18px 40px', fontSize: '1.1rem', minWidth: '200px' }}
          >
            Start a Campaign
          </a>
          <a
            href="/explore"
            className="btn-secondary"
            style={{
              padding: '18px 40px',
              fontSize: '1.1rem',
              minWidth: '200px',
              border: '2px solid #0f172a',
              background: 'transparent',
              color: '#0f172a',
            }}
          >
            Back a Project
          </a>
        </div>

        {/* Clean Transparency Mockup */}
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              border: '1px solid #f1f5f9',
              boxShadow: '0 20px 50px rgba(0,0,0,0.05)',
              padding: 'clamp(24px, 5vw, 48px)',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                whiteSpace: 'nowrap',
                gap: '20px',
                marginBottom: '32px',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <p style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-primary)', marginBottom: '8px', letterSpacing: '0.1em' }}>
                  Live Transparency Log
                </p>
                <h3 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', color: '#0f172a', fontWeight: 800 }}>
                  Indie Film: "Echoes"
                </h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 className="text-gradient" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 900 }}>
                  ₦1,250,400
                </h2>
                <p style={{ color: '#64748b', fontWeight: 600, fontSize: '0.9rem' }}>
                  of ₦2,000,000 goal
                </p>
              </div>
            </div>

            <div style={{ height: '10px', background: '#f1f5f9', borderRadius: '5px', marginBottom: '32px', overflow: 'hidden' }}>
              <div style={{ width: '62.5%', height: '100%', background: 'var(--accent-primary)' }} />
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
              <p style={{ fontWeight: 800, fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '16px' }}>Latest Spending</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ padding: '12px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9', flex: '1', minWidth: '200px' }}>
                  <p style={{ fontSize: '0.8rem', opacity: 0.6, fontWeight: 600 }}>Just Now</p>
                  <p style={{ fontWeight: 800, color: '#0f172a' }}>Camera Rig Rental <span style={{ color: 'var(--accent-primary)', marginLeft: '8px' }}>₦250,000</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
