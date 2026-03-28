'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PricingPage() {
  const [raiseAmount, setRaiseAmount] = useState<number | string>(100000);

  const platformFeeRate = 0.05;
  const processingFeeRate = 0.015;

  const validAmount = Number(raiseAmount) || 0;
  const backrFee = validAmount * platformFeeRate;
  const processingFee = validAmount * processingFeeRate;
  const totalDeductions = backrFee + processingFee;
  const estimatedPayout = validAmount - totalDeductions;

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
            padding: '80px 24px',
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
              marginBottom: '16px',
              fontFamily: 'Outfit, sans-serif',
            }}
          >
            Simple, transparent pricing
          </h1>
          <p
            style={{
              fontSize: '1.25rem',
              color: '#475569',
              maxWidth: '600px',
              margin: '0 auto 40px',
              lineHeight: 1.6,
            }}
          >
            No setup fees. No monthly charges. You only pay when you get backed.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="/login?from=/dashboard"
              className="btn-primary"
              style={{ padding: '16px 36px', fontSize: '1.1rem', textDecoration: 'none' }}
            >
              Start a Campaign
            </a>
            <a
              href="/explore"
              style={{
                padding: '16px 36px',
                fontSize: '1.1rem',
                borderRadius: '12px',
                background: '#f1f5f9',
                color: '#475569',
                fontWeight: 700,
                textDecoration: 'none',
                transition: 'background 0.2s',
              }}
            >
              Explore Campaigns
            </a>
          </div>
        </section>

        {/* PRICING OVERVIEW & CALCULATOR WIDGET */}
        <section
          style={{
            padding: '80px 24px',
            maxWidth: '1100px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            gap: '64px',
            alignItems: 'flex-start',
          }}
        >
          <div
            className="pricing-grid-left"
            style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}
          >
            {/* OVERVIEW */}
            <div>
              <h3
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  marginBottom: '20px',
                }}
              >
                Pricing Overview
              </h3>
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
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    color: '#0f172a',
                    fontSize: '1.1rem',
                  }}
                >
                  <span style={{ color: '#10b981', fontWeight: 900 }}>✓</span> Backr Platform Fee:
                  3–5% per successful campaign
                </li>
                <li
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    color: '#0f172a',
                    fontSize: '1.1rem',
                  }}
                >
                  <span style={{ color: '#10b981', fontWeight: 900 }}>✓</span> Payment Processing:
                  handled by providers like Paystack or Flutterwave
                </li>
              </ul>
              <p
                style={{
                  marginTop: '20px',
                  fontSize: '1rem',
                  color: '#64748b',
                  lineHeight: 1.6,
                  padding: '16px',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                }}
              >
                Processing fees are separate and go directly to the payment provider, not Backr.
              </p>
            </div>

            {/* EXAMPLE BREAKDOWN */}
            <div>
              <h3
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  marginBottom: '20px',
                }}
              >
                Example Breakdown
              </h3>
              <div
                style={{
                  padding: '24px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                }}
              >
                <p
                  style={{
                    fontSize: '1.1rem',
                    color: '#0f172a',
                    fontWeight: 700,
                    marginBottom: '16px',
                  }}
                >
                  If you raise ₦100,000:
                </p>
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    color: '#475569',
                  }}
                >
                  <li
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid #f1f5f9',
                      paddingBottom: '12px',
                    }}
                  >
                    <span>Backr fee (5%)</span>
                    <span style={{ fontWeight: 600, color: '#ef4444' }}>- ₦5,000</span>
                  </li>
                  <li
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid #f1f5f9',
                      paddingBottom: '12px',
                    }}
                  >
                    <span>Processing (~1.5%)</span>
                    <span style={{ fontWeight: 600, color: '#ef4444' }}>- ₦1,500</span>
                  </li>
                  <li
                    style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px' }}
                  >
                    <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.1rem' }}>
                      You receive
                    </span>
                    <span style={{ fontWeight: 800, color: '#10b981', fontSize: '1.2rem' }}>
                      ₦93,500
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* WHAT YOU GET */}
            <div>
              <h3
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  marginBottom: '20px',
                }}
              >
                What You Get
              </h3>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: '16px',
                }}
              >
                <li
                  style={{
                    color: '#475569',
                    fontSize: '1.05rem',
                    display: 'flex',
                    gap: '16px',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      background: 'var(--accent-primary)',
                      borderRadius: '50%',
                    }}
                  ></div>
                  Campaign pages designed for fundraising
                </li>
                <li
                  style={{
                    color: '#475569',
                    fontSize: '1.05rem',
                    display: 'flex',
                    gap: '16px',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      background: 'var(--accent-primary)',
                      borderRadius: '50%',
                    }}
                  ></div>
                  Public spending logs for transparency
                </li>
                <li
                  style={{
                    color: '#475569',
                    fontSize: '1.05rem',
                    display: 'flex',
                    gap: '16px',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      background: 'var(--accent-primary)',
                      borderRadius: '50%',
                    }}
                  ></div>
                  Updates to communicate with supporters
                </li>
                <li
                  style={{
                    color: '#475569',
                    fontSize: '1.05rem',
                    display: 'flex',
                    gap: '16px',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      background: 'var(--accent-primary)',
                      borderRadius: '50%',
                    }}
                  ></div>
                  Secure payment handling
                </li>
                <li
                  style={{
                    color: '#475569',
                    fontSize: '1.05rem',
                    display: 'flex',
                    gap: '16px',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      background: 'var(--accent-primary)',
                      borderRadius: '50%',
                    }}
                  ></div>
                  Tools built for creators
                </li>
              </ul>
            </div>

            {/* NO HIDDEN FEES */}
            <div
              style={{
                background: '#ecfdf5',
                padding: '32px',
                borderRadius: '16px',
                border: '1px solid #10b981',
              }}
            >
              <h3
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: '#065f46',
                  marginBottom: '16px',
                }}
              >
                No Hidden Fees
              </h3>
              <p
                style={{ color: '#064e3b', fontSize: '1.05rem', lineHeight: 1.8, fontWeight: 500 }}
              >
                <span style={{ marginRight: '12px' }}>✦</span> No setup fees.
                <br />
                <span style={{ marginRight: '12px' }}>✦</span> No monthly subscription (for now).
                <br />
                <span style={{ marginRight: '12px' }}>✦</span> No charge if you don’t raise money.
              </p>
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              padding: '48px',
              borderRadius: '32px',
              boxShadow: '0 40px 100px rgba(15,23,42,0.08)',
              border: '1px solid #e2e8f0',
              position: 'sticky',
              top: '100px',
            }}
          >
            <h3
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: '#0f172a',
                marginBottom: '32px',
              }}
            >
              Pricing Calculator
            </h3>

            <div style={{ marginBottom: '40px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: '#475569',
                  marginBottom: '12px',
                }}
              >
                Amount you want to raise
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '20px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontWeight: 'bold',
                    fontSize: '1.25rem',
                    color: '#0f172a',
                  }}
                >
                  ₦
                </span>
                <input
                  type="number"
                  value={raiseAmount}
                  onChange={(e) => setRaiseAmount(e.target.value)}
                  min="0"
                  style={{
                    width: '100%',
                    padding: '20px 20px 20px 48px',
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    borderRadius: '16px',
                    border: '2px solid #e2e8f0',
                    outline: 'none',
                    color: '#0f172a',
                    transition: 'border 0.2s',
                    background: '#f8fafc',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '24px',
                  borderBottom: '1px solid #f1f5f9',
                }}
              >
                <span style={{ color: '#475569', fontSize: '1.1rem', fontWeight: 500 }}>
                  Target Raise Amount
                </span>
                <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.2rem' }}>
                  ₦{validAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span style={{ color: '#ef4444', fontSize: '1.1rem', fontWeight: 500 }}>
                  Backr Fee (5%)
                </span>
                <span style={{ fontWeight: 700, color: '#ef4444', fontSize: '1.2rem' }}>
                  - ₦{backrFee.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '24px',
                  borderBottom: '1px solid #e2e8f0',
                }}
              >
                <span style={{ color: '#ef4444', fontSize: '1.1rem', fontWeight: 500 }}>
                  Processing Fee (~1.5%)
                </span>
                <span style={{ fontWeight: 700, color: '#ef4444', fontSize: '1.2rem' }}>
                  - ₦{processingFee.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '16px',
                }}
              >
                <span style={{ color: '#10b981', fontSize: '1.4rem', fontWeight: 900 }}>
                  Estimated Payout
                </span>
                <span style={{ fontWeight: 900, color: '#10b981', fontSize: '2rem' }}>
                  ₦
                  {Math.max(0, estimatedPayout).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            <p
              style={{
                marginTop: '32px',
                fontSize: '0.85rem',
                color: '#94a3b8',
                lineHeight: 1.6,
                textAlign: 'center',
              }}
            >
              Processing fees are estimates and may vary depending on the payment provider and
              transaction type.
            </p>
          </div>

          <style jsx>{`
            @media (max-width: 900px) {
              section {
                grid-template-columns: 1fr !important;
                gap: 48px !important;
              }
              .pricing-grid-left {
                gap: 40px !important;
              }
            }
          `}</style>
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
