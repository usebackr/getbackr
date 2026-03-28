import React from 'react';

export default function Hero() {
  return (
    <section
      style={{
        padding: '80px 24px 100px',
        textAlign: 'center',
        background: 'radial-gradient(circle at top right, rgba(255, 122, 0, 0.05), transparent)',
      }}
    >
      <div className="container">
        <h1
          style={{
            fontSize: 'clamp(2.5rem, 8vw, 5rem)',
            lineHeight: 1.1,
            marginBottom: '24px',
            color: 'var(--accent-secondary)',
          }}
        >
          Funding that is <br />
          <span className="text-gradient">built on Transparency.</span>
        </h1>
        <p
          style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
            color: 'var(--text-secondary)',
            maxWidth: '640px',
            margin: '0 auto 48px',
            lineHeight: 1.6,
          }}
        >
          The first crowdfunding platform designed for African creators. Raise funds and build
          radical trust with your community through public spending logs.
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
            style={{
              padding: '16px 40px',
              fontSize: '1.1rem',
              flex: '1 1 200px',
              maxWidth: '300px',
            }}
          >
            Start a Campaign
          </a>
          <a
            href="/explore"
            className="btn-secondary"
            style={{
              padding: '14px 40px',
              fontSize: '1.1rem',
              flex: '1 1 200px',
              maxWidth: '300px',
            }}
          >
            Back a Project
          </a>
        </div>

        {/* Floating "Live Log" Mockup - Optimized for Mobile */}
        <div
          className="card"
          style={{
            maxWidth: '860px',
            margin: '0 auto',
            padding: 'clamp(24px, 5vw, 48px)',
            boxShadow: '0 40px 100px rgba(15, 23, 42, 0.1)',
            textAlign: 'left',
            background: '#ffffff',
            borderRadius: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '32px',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <p
                style={{
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  letterSpacing: '0.1em',
                  color: 'var(--accent-primary)',
                  fontWeight: 800,
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    background: 'var(--accent-primary)',
                    borderRadius: '50%',
                    marginRight: '8px',
                    display: 'inline-block',
                  }}
                ></span>
                Live Campaign
              </p>
              <h3
                style={{
                  fontSize: 'clamp(1.4rem, 4vw, 2rem)',
                  color: 'var(--accent-secondary)',
                  lineHeight: 1.2,
                }}
              >
                "The Last Village" — Short Film
              </h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 className="text-gradient" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.4rem)' }}>
                ₦2,450,000
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem' }}>
                of ₦5,000,000 raised
              </p>
            </div>
          </div>

          <div
            style={{
              height: '8px',
              background: '#f1f5f9',
              borderRadius: '4px',
              marginBottom: '32px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '49%',
                height: '100%',
                background: 'var(--accent-primary)',
                borderRadius: '4px',
              }}
            ></div>
          </div>

          <div>
            <p
              style={{
                fontWeight: 800,
                marginBottom: '16px',
                color: 'var(--accent-secondary)',
                textTransform: 'uppercase',
                fontSize: '0.8rem',
              }}
            >
              Public Spending Log:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                {
                  date: 'Today',
                  item: 'Camera Equipment Rental',
                  cost: '₦120,000',
                  status: 'Verified',
                },
                {
                  date: '2 days ago',
                  item: 'Location Scout — Epe',
                  cost: '₦45,000',
                  status: 'Verified',
                },
              ].map((entry, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid #f1f5f9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#fdfdfd',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <span style={{ opacity: 0.5, fontSize: '0.75rem', fontWeight: 600 }}>
                      {entry.date}
                    </span>
                    <span
                      style={{
                        fontWeight: 600,
                        color: 'var(--accent-secondary)',
                        fontSize: '0.9rem',
                      }}
                    >
                      {entry.item}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center',
                      marginLeft: 'auto',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.7rem',
                        padding: '2px 8px',
                        background: '#ecfdf5',
                        color: '#059669',
                        borderRadius: '99px',
                        fontWeight: 700,
                      }}
                    >
                      {entry.status}
                    </span>
                    <span
                      style={{
                        color: 'var(--accent-secondary)',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                      }}
                    >
                      {entry.cost}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
