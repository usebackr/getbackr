'use client';

import React from 'react';

export default function Hero() {
  return (
    <section
      className="hero-section"
      style={{
        position: 'relative',
        padding: 'clamp(80px, 15vw, 160px) 24px',
        textAlign: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Animated Mesh Background Blobs */}
      <div className="mesh-blob mesh-blob-1"></div>
      <div className="mesh-blob mesh-blob-2"></div>
      
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="fade-in-up">
          <h1
            style={{
              fontSize: 'clamp(3rem, 10vw, 6rem)', // Increased mobile min from 2.5 to 3
              lineHeight: 1.05,
              marginBottom: '28px',
              fontWeight: 900,
              letterSpacing: '-0.04em',
              color: 'var(--accent-secondary)',
            }}
          >
            Funding that is <br />
            <span className="text-gradient" style={{ filter: 'drop-shadow(0 0 30px rgba(16, 185, 129, 0.2))' }}>
              built on Trust.
            </span>
          </h1>
          <p
            style={{
              fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
              color: 'var(--text-secondary)',
              maxWidth: '680px',
              margin: '0 auto 56px',
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
              gap: '20px',
              justifyContent: 'center',
              marginBottom: '100px',
              flexWrap: 'wrap',
            }}
          >
            <a
              href="/signup"
              className="btn-primary"
              style={{
                padding: '18px 48px',
                fontSize: '1.1rem',
                minWidth: '220px',
                boxShadow: '0 20px 40px rgba(16, 185, 129, 0.2)'
              }}
            >
              Start a Campaign
            </a>
            <a
              href="/explore"
              className="btn-secondary"
              style={{
                padding: '16px 48px',
                fontSize: '1.1rem',
                minWidth: '220px',
                background: 'rgba(255,255,255,0.5)',
                backdropFilter: 'blur(10px)'
              }}
            >
              Back a Project
            </a>
          </div>
        </div>

        {/* Floating 3D "Spending Log" Mockup */}
        <div className="hero-card-container fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div
            className="card glass floating-3d"
            style={{
              maxWidth: '920px',
              margin: '0 auto',
              padding: 'clamp(24px, 5vw, 56px)',
              textAlign: 'left',
              border: '1px solid rgba(255,255,255,0.4)',
              boxShadow: '0 40px 120px rgba(15, 23, 42, 0.12)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '40px',
                flexWrap: 'wrap',
                gap: '20px',
              }}
            >
              <div>
                <p className="status-badge">
                  <span className="dot pulse"></span>
                  Live Transparency Log
                </p>
                <h3 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.4rem)', color: 'var(--accent-secondary)', fontWeight: 800 }}>
                  "Echoes of the Sahara" — Kano
                </h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 className="text-gradient" style={{ fontSize: 'clamp(2rem, 5vw, 2.8rem)', fontWeight: 900 }}>
                  ₦2,450,000
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '1rem' }}>
                  of ₦5,000,000 goal
                </p>
              </div>
            </div>

            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: '49%' }}></div>
            </div>

            <div className="spending-log-preview">
              <p className="log-title">Latest Transactions</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { date: 'Just now', item: 'Solar Inverter (Shoprite)', cost: '₦450,000', cat: 'Tech' },
                  { date: 'Yesterday', item: 'Community Hall Rental', cost: '₦85,000', cat: 'Ops' },
                ].map((entry, idx) => (
                  <div key={idx} className="log-entry">
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <span className="log-date">{entry.date}</span>
                      <span className="log-item">{entry.item}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginLeft: 'auto' }}>
                      <span className="log-tag">{entry.cat}</span>
                      <span className="log-cost">{entry.cost}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hero-section {
          background: #ffffff;
        }
        .mesh-blob {
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          filter: blur(120px);
          z-index: 0;
          animation: mesh 20s infinite alternate;
          opacity: 0.15;
        }
        .mesh-blob-1 {
          background: var(--accent-primary);
          top: -200px;
          right: -100px;
        }
        .mesh-blob-2 {
          background: #3b82f6;
          bottom: -200px;
          left: -100px;
          animation-delay: -5s;
        }
        .status-badge {
          text-transform: uppercase;
          font-size: 0.8rem;
          letter-spacing: 0.15em;
          color: var(--accent-primary);
          font-weight: 800;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .dot {
          width: 10px;
          height: 10px;
          background: var(--accent-primary);
          border-radius: 50%;
        }
        .pulse {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .progress-bar-container {
          height: 12px;
          background: #f1f5f9;
          border-radius: 6px;
          margin-bottom: 40px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          background: var(--accent-primary);
          border-radius: 6px;
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
        }
        .log-title {
          font-weight: 800;
          margin-bottom: 20px;
          color: var(--accent-secondary);
          text-transform: uppercase;
          font-size: 0.85rem;
          letter-spacing: 0.05em;
          text-align: left;
        }
        .log-entry {
          padding: 16px 20px;
          border-radius: 16px;
          border: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255,255,255,0.5);
          backdrop-filter: blur(5px);
          flex-wrap: wrap;
          gap: 12px;
        }
        .log-date { opacity: 0.4; font-size: 0.8rem; font-weight: 600; }
        .log-item { font-weight: 700; color: var(--accent-secondary); font-size: 1rem; }
        .log-tag { font-size: 0.7rem; padding: 4px 10px; background: #f1f5f9; border-radius: 8px; font-weight: 700; color: #64748b; }
        .log-cost { font-weight: 900; color: var(--accent-primary); font-size: 1.1rem; }
        
        .floating-3d {
          transform: perspective(1000px) rotateX(2deg) rotateY(-1deg);
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .floating-3d:hover {
          transform: perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1.01);
        }
        
        .fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
