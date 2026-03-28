import React from 'react';

export default function Footer() {
  return (
    <footer
      style={{
        padding: '100px 24px 60px',
        background: 'var(--accent-secondary)',
        color: '#ffffff',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '64px',
            marginBottom: '80px',
          }}
        >
          <div style={{ maxWidth: '300px' }}>
            <h2
              style={{
                fontSize: '1.8rem',
                fontWeight: 900,
                marginBottom: '24px',
                color: '#ffffff',
              }}
            >
              Backr
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', lineHeight: 1.6 }}>
              Empowering the next generation of African creators through transparency,
              accountability, and community.
            </p>
          </div>
          <div>
            <h4
              style={{
                marginBottom: '28px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontSize: '0.9rem',
              }}
            >
              Platform
            </h4>
            <ul
              style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <li>
                <a
                  href="/explore"
                  style={{
                    color: 'rgba(255,255,255,0.7)',
                    textDecoration: 'none',
                    fontSize: '1rem',
                    transition: 'color 0.2s',
                  }}
                >
                  Explore Campaigns
                </a>
              </li>
              <li>
                <a
                  href="/how-it-works"
                  style={{
                    color: 'rgba(255,255,255,0.7)',
                    textDecoration: 'none',
                    fontSize: '1rem',
                  }}
                >
                  How it Works
                </a>
              </li>
              <li>
                <a
                  href="/pricing"
                  style={{
                    color: 'rgba(255,255,255,0.7)',
                    textDecoration: 'none',
                    fontSize: '1rem',
                  }}
                >
                  Pricing
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4
              style={{
                marginBottom: '28px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontSize: '0.9rem',
              }}
            >
              Company
            </h4>
            <ul
              style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <li>
                <a
                  href="/about"
                  style={{
                    color: 'rgba(255,255,255,0.7)',
                    textDecoration: 'none',
                    fontSize: '1rem',
                  }}
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  style={{
                    color: 'rgba(255,255,255,0.7)',
                    textDecoration: 'none',
                    fontSize: '1rem',
                  }}
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  style={{
                    color: 'rgba(255,255,255,0.7)',
                    textDecoration: 'none',
                    fontSize: '1rem',
                  }}
                >
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4
              style={{
                marginBottom: '28px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontSize: '0.9rem',
              }}
            >
              Social
            </h4>
            <ul
              style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <li>
                <a
                  href="https://twitter.com"
                  style={{
                    color: 'rgba(255,255,255,0.7)',
                    textDecoration: 'none',
                    fontSize: '1rem',
                  }}
                >
                  Twitter / X
                </a>
              </li>
              <li>
                <a
                  href="https://instagram.com"
                  style={{
                    color: 'rgba(255,255,255,0.7)',
                    textDecoration: 'none',
                    fontSize: '1rem',
                  }}
                >
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '40px',
            textAlign: 'center',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '0.9rem',
          }}
        >
          © {new Date().getFullYear()} Backr Platform. Built for African creators.
        </div>
      </div>
    </footer>
  );
}
