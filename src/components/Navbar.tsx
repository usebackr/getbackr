import React from 'react';

export default function Navbar() {
  return (
    <nav
      className="glass"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
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
          padding: '12px 24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <a href="/" style={{ textDecoration: 'none' }}>
          <h2 className="text-gradient" style={{ fontSize: '1.8rem', fontWeight: 900 }}>
            Backr
          </h2>
        </a>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(12px, 3vw, 32px)',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <a
            href="/explore"
            style={{
              color: 'var(--text-primary)',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            Explore
          </a>
          <a
            href="/how-it-works"
            style={{
              color: 'var(--text-primary)',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            How it Works
          </a>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <a
              href="/login"
              style={{
                color: 'var(--text-primary)',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              Log In
            </a>
            <a
              href="/signup"
              className="btn-primary"
              style={{ padding: '10px 20px', fontSize: '0.85rem' }}
            >
              Get Started
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
