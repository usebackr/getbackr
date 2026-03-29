'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const Icons = {
  Menu: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  Close: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  ChevronRight: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
};

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        setIsAuthenticated(data.authenticated);
      } catch (err) {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  const AuthButtons = ({ isMobile = false }) => {
    if (loading) return null;
    if (isAuthenticated) {
      return (
        <a 
          href="/dashboard" 
          className="btn-primary" 
          style={{ padding: '12px 32px', fontSize: isMobile ? '1.1rem' : '0.85rem', width: isMobile ? '100%' : 'auto', textAlign: 'center' }}
          onClick={() => isMobile && setIsOpen(false)}
        >
          Back to Dashboard
        </a>
      );
    }
    return (
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', width: isMobile ? '100%' : 'auto', flexDirection: isMobile ? 'column' : 'row' }}>
        <a 
          href="/login" 
          style={{ 
            color: 'var(--text-primary)', 
            textDecoration: 'none', 
            fontWeight: 600, 
            fontSize: isMobile ? '1.1rem' : '0.95rem',
            width: isMobile ? '100%' : 'auto'
          }}
          onClick={() => isMobile && setIsOpen(false)}
        >
          Log In
        </a>
        <a 
          href="/signup" 
          className="btn-primary" 
          style={{ padding: '12px 32px', fontSize: isMobile ? '1.1rem' : '0.85rem', width: isMobile ? '100%' : 'auto', textAlign: 'center' }}
          onClick={() => isMobile && setIsOpen(false)}
        >
          Get Started
        </a>
      </div>
    );
  };

  return (
    <header
      className="glass"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 2000,
        minHeight: '80px',
        borderBottom: '1px solid var(--glass-border)',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '0 24px',
        }}
      >
        <a href="/" style={{ textDecoration: 'none' }}>
          <h2 className="text-gradient" style={{ fontSize: '1.8rem', fontWeight: 900 }}>
            Backr
          </h2>
        </a>

        <div className="nav-links-desktop">
          <a href="/explore">Explore</a>
          <a href="/how-it-works">How it Works</a>
          <AuthButtons />
        </div>

        <button
          className="nav-toggle"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Menu"
          style={{ border: 'none', background: 'none' }}
        >
          {isOpen ? <Icons.Close /> : <Icons.Menu />}
        </button>
      </div>

      <div className={`nav-overlay ${isOpen ? 'open' : ''}`}>
        <div className="nav-overlay-header">
           <a href="/" onClick={() => setIsOpen(false)} style={{ textDecoration: 'none' }}>
            <h2 className="text-gradient" style={{ fontSize: '1.4rem', fontWeight: 900 }}>Backr</h2>
          </a>
          <button onClick={() => setIsOpen(false)} style={{ border: 'none', background: 'none', padding: '8px' }}>
            <Icons.Close />
          </button>
        </div>
        
        <nav className="nav-overlay-content">
          <a href="/about" onClick={() => setIsOpen(false)}>About</a>
          <a href="/explore" onClick={() => setIsOpen(false)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Explore <Icons.ChevronRight />
          </a>
          <a href="/pricing" onClick={() => setIsOpen(false)}>Pricing</a>
          <a href="/how-it-works" onClick={() => setIsOpen(false)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            How it Works <Icons.ChevronRight />
          </a>
          <a href="/blog" onClick={() => setIsOpen(false)}>Blog</a>
          
          <div className="nav-overlay-footer">
            <AuthButtons isMobile />
          </div>
        </nav>
      </div>

      <style jsx>{`
        .nav-links-desktop {
          display: flex;
          align-items: center;
          gap: 32px;
        }
        .nav-links-desktop a {
          color: var(--text-primary);
          text-decoration: none;
          font-weight: 600;
          font-size: 0.95rem;
          transition: opacity 0.2s;
        }
        .nav-links-desktop a:hover { opacity: 0.7; }
        
        .nav-toggle {
          display: none;
          cursor: pointer;
          color: var(--text-primary);
          padding: 8px;
          z-index: 2200;
        }

        @media (max-width: 1024px) {
          .nav-links-desktop { display: none; }
          .nav-toggle { display: block; }
        }
      `}</style>
    </header>
  );
}
