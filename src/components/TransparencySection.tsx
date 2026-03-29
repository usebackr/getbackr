'use client';

import React from 'react';

export default function TransparencySection() {
  const steps = [
    {
      idx: '01',
      title: 'Initiate Campaign',
      desc: 'Set your vision and goal. Our smart-contract layer starts tracking your project readiness.',
      color: '#10b981'
    },
    {
      idx: '02',
      title: 'Real-time Logs',
      desc: 'Every naira spent is logged instantly. Upload receipts and categories with one click.',
      color: '#3b82f6'
    },
    {
      idx: '03',
      title: 'Radical Loyalty',
      desc: 'Backers see exactly how their funds fuel your dream, turning them into lifelong fans.',
      color: '#8b5cf6'
    },
  ];

  return (
    <section 
      style={{ 
        padding: 'clamp(80px, 12vw, 160px) 24px', 
        background: '#f8fafc',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '100px', position: 'relative', zIndex: 1 }}>
          <p style={{ textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.2em', color: 'var(--accent-primary)', fontWeight: 800, marginBottom: '20px' }}>
            Transparency as a Feature
          </p>
          <h2
            style={{
              fontSize: 'clamp(2.5rem, 6vw, 4rem)',
              marginBottom: '28px',
              color: 'var(--accent-secondary)',
              fontWeight: 900,
              letterSpacing: '-0.03em'
            }}
          >
            Trust is the new <span className="text-gradient">Currency.</span>
          </h2>
          <p
            style={{
              color: 'var(--text-secondary)',
              maxWidth: '600px',
              margin: '0 auto',
              fontSize: '1.2rem',
              lineHeight: 1.6,
              fontWeight: 500
            }}
          >
            We've built a system that turns contributions into accountability. 
            No more guessing where the money went—just a direct link between backers and impact.
          </p>
        </div>

        <div className="steps-container">
          {steps.map((step, i) => (
            <div key={i} className="step-card glass">
              <div className="step-index" style={{ color: step.color }}>{step.idx}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.desc}</p>
              <div className="step-glow" style={{ background: step.color }}></div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .steps-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 32px;
          position: relative;
          z-index: 1;
        }
        
        .step-card {
          padding: 60px 40px;
          border-radius: 32px;
          background: #ffffff;
          border: 1px solid rgba(226, 232, 240, 0.5);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
          text-align: left;
        }
        
        .step-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 30px 60px rgba(15, 23, 42, 0.08);
          border-color: rgba(16, 185, 129, 0.2);
        }
        
        .step-index {
          font-family: 'Outfit', sans-serif;
          font-size: 3.5rem;
          font-weight: 900;
          line-height: 1;
          margin-bottom: 32px;
          opacity: 0.15;
          transition: opacity 0.3s;
        }
        
        .step-card:hover .step-index {
          opacity: 0.6;
        }
        
        .step-title {
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--accent-secondary);
          margin-bottom: 20px;
          letter-spacing: -0.02em;
        }
        
        .step-desc {
          font-size: 1.05rem;
          color: var(--text-secondary);
          line-height: 1.7;
          font-weight: 500;
        }
        
        .step-glow {
          position: absolute;
          width: 140px;
          height: 140px;
          border-radius: 50%;
          bottom: -70px;
          right: -70px;
          filter: blur(60px);
          opacity: 0;
          transition: opacity 0.5s;
        }
        
        .step-card:hover .step-glow {
          opacity: 0.15;
        }
      `}</style>
    </section>
  );
}
