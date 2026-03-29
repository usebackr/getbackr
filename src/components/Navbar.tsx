'use client';

import React, { useState, useEffect } from 'react';

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
  )
};

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  // Prevent scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

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

        {/* Desktop Links */}
        <div className="nav-links-desktop">
          <a href="/explore">Explore</a>
          <a href="/how-it-works">How it Works</a>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginLeft: '12px' }}>
            <a href="/login">Log In</a>
            <a href="/signup" className="btn-primary" style={{ padding: '10px 24px', fontSize: '0.85rem' }}>
              Get Started
            </a>
          </div>
        </div>

        {/* Mobile Toggle */}
        <button
          className="nav-toggle"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Menu"
        >
          {isOpen ? <Icons.Close /> : <Icons.Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`nav-overlay ${isOpen ? 'open' : ''}`}>
        <nav className="nav-overlay-content">
          <a href="/explore" onClick={() => setIsOpen(false)}>Explore</a>
          <a href="/how-it-works" onClick={() => setIsOpen(false)}>How it Works</a>
          <div className="nav-overlay-divider" />
          <a href="/login" onClick={() => setIsOpen(false)}>Log In</a>
          <a href="/signup" className="btn-primary" onClick={() => setIsOpen(false)}>
            Get Started
          </a>
        </nav>
      </div>

      <style jsx>{`
        .nav-links-desktop {
          display: flex;
          alignItems: center;
          gap: 32px;
        }
        .nav-links-desktop a {
          color: var(--text-primary);
          textDecoration: none;
          fontWeight: 600;
          fontSize: 0.95rem;
          transition: opacity 0.2s;
        }
        .nav-links-desktop a:hover {
          opacity: 0.7;
        }
        .nav-toggle {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-primary);
          padding: 8px;
          z-index: 2100;
        }
        .nav-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #ffffff;
          z-index: 2050;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: translateY(-100%);
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .nav-overlay.open {
          transform: translateY(0);
        }
        .nav-overlay-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 32px;
          text-align: center;
          width: 100%;
          padding: 24px;
        }
        .nav-overlay-content a {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--accent-secondary);
          text-decoration: none;
          font-family: 'Outfit', sans-serif;
        }
        .nav-overlay-divider {
          width: 40px;
          height: 2px;
          background: #f1f5f9;
        }

        @media (max-width: 1024px) {
          .nav-links-desktop {
            display: none;
          }
          .nav-toggle {
            display: block;
          }
        }
      `}</style>
    </header>
  );
}
