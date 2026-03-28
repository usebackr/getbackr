import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AboutPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#fafafa',
      }}
    >
      <Navbar />
      <div style={{ flex: 1 }}>
        {/* HERO SECTION */}
        <section
          style={{
            padding: '100px 24px 60px',
            textAlign: 'center',
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <h1
            style={{
              fontSize: '3.5rem',
              fontWeight: 900,
              color: '#0f172a',
              marginBottom: '24px',
              fontFamily: 'Outfit, sans-serif',
            }}
          >
            About Backr
          </h1>
          <p
            style={{
              fontSize: '1.35rem',
              color: '#475569',
              maxWidth: '700px',
              margin: '0 auto',
              lineHeight: 1.6,
              fontWeight: 500,
            }}
          >
            Backr helps creators raise money from their audience and show exactly how it’s used.
          </p>
        </section>

        {/* CONTENT SECTIONS */}
        <section
          style={{
            padding: '80px 24px',
            maxWidth: '800px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '64px',
          }}
        >
          <div className="content-block">
            <h2
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: '#0f172a',
                marginBottom: '24px',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              Why we built it
            </h2>
            <p
              style={{
                fontSize: '1.15rem',
                color: '#334155',
                lineHeight: 1.8,
                marginBottom: '20px',
              }}
            >
              Creators often rely on informal funding methods like bank transfers, social posts, or
              direct requests.
            </p>
            <p
              style={{
                fontSize: '1.15rem',
                color: '#334155',
                lineHeight: 1.8,
                marginBottom: '20px',
              }}
            >
              Supporters want to help, but often lack visibility into how the money is used. This
              makes funding inconsistent and trust difficult to maintain over time.
            </p>
            <p style={{ fontSize: '1.15rem', color: '#334155', lineHeight: 1.8, fontWeight: 600 }}>
              Backr was built to improve that process.
            </p>
          </div>

          <div style={{ width: '100%', height: '1px', background: '#e2e8f0' }}></div>

          <div className="content-block">
            <h2
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: '#0f172a',
                marginBottom: '24px',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              What Backr does
            </h2>
            <p
              style={{
                fontSize: '1.15rem',
                color: '#334155',
                lineHeight: 1.8,
                marginBottom: '20px',
              }}
            >
              Backr gives creators a structured way to launch campaigns, receive support, share
              their ongoing updates, and publicly show exactly how those funds are used.
            </p>
          </div>

          <div style={{ width: '100%', height: '1px', background: '#e2e8f0' }}></div>

          <div className="content-block">
            <h2
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: '#0f172a',
                marginBottom: '24px',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              What makes Backr different
            </h2>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <li
                style={{
                  fontSize: '1.15rem',
                  color: '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    background: 'var(--accent-primary)',
                    borderRadius: '50%',
                  }}
                ></div>
                Transparency through public spending logs
              </li>
              <li
                style={{
                  fontSize: '1.15rem',
                  color: '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    background: 'var(--accent-primary)',
                    borderRadius: '50%',
                  }}
                ></div>
                Ongoing updates long after the funding ends
              </li>
              <li
                style={{
                  fontSize: '1.15rem',
                  color: '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    background: 'var(--accent-primary)',
                    borderRadius: '50%',
                  }}
                ></div>
                Built specifically for creator workflows
              </li>
              <li
                style={{
                  fontSize: '1.15rem',
                  color: '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    background: 'var(--accent-primary)',
                    borderRadius: '50%',
                  }}
                ></div>
                Not just about collecting money, but showing progress
              </li>
            </ul>
          </div>

          <div style={{ width: '100%', height: '1px', background: '#e2e8f0' }}></div>

          <div
            className="content-block"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}
          >
            <div style={{ gridColumn: '1 / -1' }}>
              <h2
                style={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  marginBottom: '24px',
                  fontFamily: 'Outfit, sans-serif',
                }}
              >
                Who it is for
              </h2>
            </div>

            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                gridColumn: '1 / -1',
              }}
            >
              <li
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  padding: '16px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  display: 'flex',
                  gap: '16px',
                }}
              >
                <span style={{ color: 'var(--accent-primary)' }}>➔</span> Filmmakers
              </li>
              <li
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  padding: '16px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  display: 'flex',
                  gap: '16px',
                }}
              >
                <span style={{ color: 'var(--accent-primary)' }}>➔</span> Musicians
              </li>
              <li
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  padding: '16px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  display: 'flex',
                  gap: '16px',
                }}
              >
                <span style={{ color: 'var(--accent-primary)' }}>➔</span> Visual artists
              </li>
              <li
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  padding: '16px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  display: 'flex',
                  gap: '16px',
                }}
              >
                <span style={{ color: 'var(--accent-primary)' }}>➔</span> Writers
              </li>
              <li
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  padding: '16px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  display: 'flex',
                  gap: '16px',
                }}
              >
                <span style={{ color: 'var(--accent-primary)' }}>➔</span> Creative communities
              </li>
            </ul>
          </div>

          <div style={{ width: '100%', height: '1px', background: '#e2e8f0' }}></div>

          <div className="content-block">
            <h2
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: '#0f172a',
                marginBottom: '24px',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              What we believe
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  padding: '24px',
                  background: '#f8fafc',
                  borderRadius: '16px',
                  borderLeft: '4px solid #0f172a',
                }}
              >
                <p
                  style={{
                    fontSize: '1.15rem',
                    color: '#334155',
                    lineHeight: 1.6,
                    fontWeight: 500,
                  }}
                >
                  People are more willing to support when they understand where the money goes.
                </p>
              </div>
              <div
                style={{
                  padding: '24px',
                  background: '#f8fafc',
                  borderRadius: '16px',
                  borderLeft: '4px solid #0f172a',
                }}
              >
                <p
                  style={{
                    fontSize: '1.15rem',
                    color: '#334155',
                    lineHeight: 1.6,
                    fontWeight: 500,
                  }}
                >
                  Creators need better tools than scattered links and direct transfers.
                </p>
              </div>
              <div
                style={{
                  padding: '24px',
                  background: '#f8fafc',
                  borderRadius: '16px',
                  borderLeft: '4px solid #0f172a',
                }}
              >
                <p
                  style={{
                    fontSize: '1.15rem',
                    color: '#334155',
                    lineHeight: 1.6,
                    fontWeight: 500,
                  }}
                >
                  Trust should be built natively into the system.
                </p>
              </div>
            </div>
          </div>

          <div className="content-block" style={{ marginTop: '32px' }}>
            <h3
              style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                marginBottom: '20px',
              }}
            >
              Looking Ahead
            </h3>
            <p style={{ fontSize: '1.15rem', color: '#334155', lineHeight: 1.8 }}>
              Backr starts as a crowdfunding platform, but it is designed to continually grow into a
              much broader system for creator funding and long-term community support.
            </p>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section
          style={{
            padding: '80px 24px',
            textAlign: 'center',
            background: '#0f172a',
            color: '#ffffff',
          }}
        >
          <h2
            style={{
              fontSize: '3rem',
              fontWeight: 900,
              marginBottom: '32px',
              fontFamily: 'Outfit, sans-serif',
            }}
          >
            Start your campaign
          </h2>
          <a
            href="/login?from=/dashboard"
            className="btn-primary"
            style={{
              padding: '18px 48px',
              fontSize: '1.2rem',
              background: '#ffffff',
              color: '#0f172a',
              textDecoration: 'none',
              borderRadius: '12px',
            }}
          >
            Start your campaign
          </a>
        </section>
      </div>
      <Footer />
    </main>
  );
}
