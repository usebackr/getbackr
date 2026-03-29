'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function HowItWorksPage() {
  const steps = [
    {
      number: '01',
      title: 'Initiate Your Vision',
      description: 'Create a campaign by outlining your project, setting a goal, and defining your timeline. Whether it’s tech, art, or community, Backr is your launchpad.',
      icon: '🚀'
    },
    {
      number: '02',
      title: 'Get Backed by Community',
      description: 'Share your story with the world. People who believe in your vision contribute funds to make it a reality. No middleman, just direct support.',
      icon: '🤝'
    },
    {
      number: '03',
      title: 'Radical Transparency',
      description: 'The core of Backr. Use your dashboard to log every spend. Upload receipts and updates so your backers see exactly how their money is changing lives.',
      icon: '💎'
    }
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
      <Navbar />
      
      <main style={{ flex: 1, padding: 'clamp(80px, 15vw, 120px) 24px 60px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <header style={{ textAlign: 'center', marginBottom: '80px' }}>
            <span style={{ 
              background: 'rgba(16, 185, 129, 0.1)', 
              color: 'var(--accent-primary)', 
              padding: '6px 16px', 
              borderRadius: '20px', 
              fontSize: '0.85rem', 
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              The Platform for Trust
            </span>
            <h1 style={{ 
              fontSize: 'clamp(2.5rem, 8vw, 4rem)', 
              fontWeight: 900, 
              marginTop: '16px', 
              letterSpacing: '-0.04em',
              lineHeight: 1.1
            }}>
              How <span className="text-gradient">Backr</span> Works
            </h1>
            <p style={{ 
              fontSize: 'clamp(1.1rem, 3vw, 1.4rem)', 
              color: 'var(--text-secondary)', 
              maxWidth: '600px', 
              margin: '24px auto 0',
              lineHeight: 1.6
            }}>
              A simple, transparent flow designed to empower creators and build lasting trust with backers.
            </p>
          </header>

          <div style={{ display: 'grid', gap: '40px' }}>
            {steps.map((step, idx) => (
              <div 
                key={idx}
                className="card"
                style={{ 
                  display: 'flex', 
                  gap: '40px', 
                  padding: '48px', 
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ 
                  fontSize: '5rem', 
                  fontWeight: 900, 
                  color: '#f1f5f9', 
                  lineHeight: 1,
                  position: 'absolute',
                  top: '20px',
                  right: '40px',
                  zIndex: 0
                }}>
                  {step.number}
                </div>
                
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  background: 'var(--accent-primary)', 
                  borderRadius: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  zIndex: 1,
                  boxShadow: '0 10px 30px rgba(16, 185, 129, 0.2)'
                }}>
                  {step.icon}
                </div>
                
                <div style={{ flex: '1 1 300px', zIndex: 1 }}>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '16px' }}>{step.title}</h3>
                  <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ 
            marginTop: '100px', 
            textAlign: 'center', 
            background: 'var(--accent-secondary)', 
            padding: '80px 40px', 
            borderRadius: '40px',
            color: '#fff'
          }}>
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 2.5rem)', marginBottom: '20px' }}>Ready to get started?</h2>
            <p style={{ opacity: 0.8, marginBottom: '40px', fontSize: '1.1rem' }}>Initiate your campaign today and join the community of trusted creators.</p>
            <a href="/dashboard/campaigns/create" className="btn-primary" style={{ padding: '18px 48px', fontSize: '1.1rem', textDecoration: 'none', display: 'inline-block' }}>
              Initiate Your Campaign
            </a>
          </div>
        </div>
      </main>

      <Footer />
      
      <style jsx>{`
        .text-gradient {
          background: linear-gradient(135deg, var(--accent-primary) 0%, #10b981 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .card {
          background: #ffffff;
          border: 1px solid #f1f5f9;
          border-radius: 32px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card:hover {
          transform: translateY(-8px);
          box-shadow: 0 30px 60px rgba(15, 23, 42, 0.08);
          border-color: var(--accent-primary);
        }
      `}</style>
    </div>
  );
}
