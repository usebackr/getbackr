'use client';

import React from 'react';
import Navbar from '@/components/Navbar';

export default function BlogPage() {
  return (
    <div style={{ background: '#ffffff', minHeight: '100vh' }}>
      <Navbar />
      
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 24px' }}>
        <header style={{ textAlign: 'center', marginBottom: '60px' }}>
          <span style={{ 
            textTransform: 'uppercase', 
            fontSize: '0.85rem', 
            fontWeight: 800, 
            color: 'var(--accent-primary)',
            letterSpacing: '0.1em'
          }}>
            Platform <span style={{ color: '#cbd5e1', margin: '0 8px' }}>•</span> March 2026
          </span>
          <h1 style={{ 
            fontSize: 'clamp(2.5rem, 6vw, 4rem)', 
            fontWeight: 900, 
            color: '#0f172a',
            lineHeight: 1.1,
            marginTop: '16px',
            marginBottom: '24px'
          }}>
            Why Everyone Needs to Support African Creators
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '20px', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>B</div>
            <p style={{ fontWeight: 600, color: '#475569' }}>The Backr Team</p>
          </div>
        </header>

        <article style={{ 
          fontFamily: "'Georgia', 'Times New Roman', serif", 
          fontSize: '1.25rem', 
          lineHeight: 1.8, 
          color: '#334155',
          textAlign: 'left'
        }}>
          <p style={{ marginBottom: '32px' }}>
            Africa is currently undergoing a creative renaissance. From the exploding Afrobeats scene to the visually stunning landscapes of African cinema and the innovative strides in digital art, the continent's creators are finally taking the global stage. But behind the glitz and glamour lies a significant challenge: <strong>sustainable funding</strong>.
          </p>

          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: '60px 0 24px' }}>
            Building Trust in a Global Market
          </h2>
          <p style={{ marginBottom: '32px' }}>
            For many African creators, the barrier to entry isn't lack of talent—it's the lack of infrastructure. Traditional banking and international funding platforms often present insurmountable hurdles, from geographic restrictions to prohibitive fees. This is where the concept of <em>Radical Trust</em> comes in.
          </p>
          
          <p style={{ marginBottom: '32px', borderLeft: '4px solid var(--accent-primary)', paddingLeft: '24px', fontStyle: 'italic', color: '#0f172a' }}>
            "Backr wasn't just built to raise funds; it was built to prove that African creativity is a viable, transparent, and world-class investment."
          </p>

          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: '60px 0 24px' }}>
            The Multiplier Effect of Creative Support
          </h2>
          <p style={{ marginBottom: '32px' }}>
            When you back an African creator, you aren't just supporting a single project. You are supporting an ecosystem. That filmmaker hires local tech talent; that artist sources materials from local suppliers; that musician builds a studio that serves the community. Your support creates a ripple effect of economic opportunity across the continent.
          </p>

          <p style={{ marginBottom: '32px' }}>
            The Next Generation of African creators is ready. They are telling stories that have never been heard, solving problems with radical innovation, and building bridges across the globe. All they need is a community that trusts them.
          </p>

          <div style={{ 
            background: '#f8fafc', 
            padding: '40px', 
            borderRadius: '24px', 
            marginTop: '80px',
            textAlign: 'center'
          }}>
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.5rem', fontWeight: 800, marginBottom: '16px' }}>Ready to make a difference?</h3>
            <p style={{ marginBottom: '24px', fontSize: '1.1rem', color: '#64748b' }}>Explore live campaigns and support a creator today.</p>
            <a href="/explore" className="btn-primary" style={{ padding: '16px 40px', fontSize: '1.1rem' }}>
              Back a Project
            </a>
          </div>
        </article>
      </main>

      <footer style={{ background: '#f8fafc', borderTop: '1px solid #f1f5f9', padding: '60px 24px', textAlign: 'center' }}>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>&copy; 2026 Backr Platform. Built for the Next Generation.</p>
      </footer>

      <style jsx global>{`
        body {
          background: #ffffff !important;
        }
      `}</style>
    </div>
  );
}
