import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
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
        <section
          style={{ padding: '80px 24px', background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}
        >
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <h1
              style={{
                fontSize: '3rem',
                fontWeight: 900,
                color: '#0f172a',
                marginBottom: '16px',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              Privacy Policy
            </h1>
            <p style={{ fontSize: '1.1rem', color: '#64748b', fontWeight: 500 }}>
              Last Updated: March 2026
            </p>
          </div>
        </section>

        <section style={{ padding: '64px 24px', maxWidth: '800px', margin: '0 auto' }}>
          <div
            className="legal-content"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '48px',
              color: '#334155',
              lineHeight: 1.8,
              fontSize: '1.05rem',
            }}
          >
            <p>
              This Privacy Policy strictly outlines how the Backr platform collects, utilizes, and
              strictly protects your data when operating as an intermediary technology platform. By
              using Backr, you unequivocally consent to this policy.
            </p>

            <div>
              <h2
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  marginBottom: '16px',
                  fontFamily: 'Outfit, sans-serif',
                }}
              >
                1. Data Collection
              </h2>
              <p>
                In order to function as a software platform, Backr unavoidably collects the
                following data types:
              </p>
              <ul style={{ paddingLeft: '24px', marginTop: '12px' }}>
                <li>
                  <strong>Personal Data:</strong> Emails, display names, and identity verification
                  logic.
                </li>
                <li>
                  <strong>Usage Data:</strong> Navigational behavior and platform feature
                  interactions.
                </li>
                <li>
                  <strong>Device Data:</strong> IP addresses and browser fingerprints securely
                  logged for fraud tracking.
                </li>
                <li>
                  <strong>Transaction Metadata:</strong> Time stamps, monetary values, and campaign
                  association of successfully processed funding.
                </li>
              </ul>
            </div>

            <div>
              <h2
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  marginBottom: '16px',
                  fontFamily: 'Outfit, sans-serif',
                }}
              >
                2. Payment Data Disclaimer
              </h2>
              <p>
                As a software intermediary—not a bank—Backr actively routes your payments securely
                to third-party payment providers (such as Paystack).
              </p>
              <p style={{ marginTop: '12px', fontWeight: 600 }}>
                Backr functionally never stores or exposes full credit card details on its servers.
              </p>
              <p style={{ marginTop: '12px' }}>
                Financial details are completely governed by the rigorous and independent privacy
                policies of our integrated payment providers.
              </p>
            </div>

            <div>
              <h2
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  marginBottom: '16px',
                  fontFamily: 'Outfit, sans-serif',
                }}
              >
                3. Data Usage
              </h2>
              <p>The data we collect from you is deployed exclusively to:</p>
              <ul style={{ paddingLeft: '24px', marginTop: '12px' }}>
                <li>Power the service delivery of the Backr platform mechanics.</li>
                <li>Operate deeply integrated internal fraud prevention tools.</li>
                <li>Run analytics for platform stability and iteration.</li>
                <li>Communicate critical functional notices directly to user accounts.</li>
              </ul>
            </div>

            <div>
              <h2
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  marginBottom: '16px',
                  fontFamily: 'Outfit, sans-serif',
                }}
              >
                4. Data Sharing
              </h2>
              <p>
                Backr strongly respects structural privacy. We must, however, functionally share
                distinct segments of your data entirely to operate the platform. We strictly share
                data with:
              </p>
              <ul style={{ paddingLeft: '24px', marginTop: '12px' }}>
                <li>Payment providers for transaction validation logic.</li>
                <li>Cloud infrastructure providers that host Backr server loads securely.</li>
                <li>
                  Legal authorities when we are explicitly and legally required to do so by a valid
                  governmental subpoena.
                </li>
              </ul>
              <p style={{ marginTop: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
                Backr does not and will never sell personal user data to marketers or data brokers.
              </p>
            </div>

            <div>
              <h2
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  marginBottom: '16px',
                  fontFamily: 'Outfit, sans-serif',
                }}
              >
                5. Security Disclaimer
              </h2>
              <p>
                Backr enforces highly diligent, reasonable structural safeguards against malicious
                access. However, because we operate identically to all natively web-based platforms,
                no system is completely and infallibly secure from zero-day vulnerabilities.
              </p>
              <p style={{ marginTop: '12px', fontWeight: 600 }}>
                By establishing an account on Backr, users explicitly accept the inherent,
                structural risks inevitably associated with operating web platforms, providing
                information over the internet, and storing data.
              </p>
            </div>

            <div>
              <h2
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  marginBottom: '16px',
                  fontFamily: 'Outfit, sans-serif',
                }}
              >
                6. Data Retention
              </h2>
              <p>
                Backr retains user data entirely and strictly as long as it is mechanically
                necessary for the operation of the product, as well as for compliance with strict
                financial and legal audit trails. Following account closure, aggregated and
                unidentifiable metrics may be retained.
              </p>
            </div>

            <div>
              <h2
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  marginBottom: '16px',
                  fontFamily: 'Outfit, sans-serif',
                }}
              >
                7. User Rights
              </h2>
              <p>
                Users inherently maintain the absolute right to strictly access, legally correct, or
                totally demand the permanent deletion of their distinct account data from Backr
                servers—subject primarily to mandatory structural legal retention limits demanded by
                fraud tracking systems.
              </p>
            </div>

            <div>
              <h2
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  marginBottom: '16px',
                  fontFamily: 'Outfit, sans-serif',
                }}
              >
                8. Liability Limitation (Data)
              </h2>
              <p>
                Backr is unequivocally not held legally or financially liable for sophisticated data
                breaches falling wildly beyond our reasonable structural control.
              </p>
              <p style={{ marginTop: '12px' }}>
                Furthermore, Backr firmly assumes entirely zero liability regarding data
                mishandling, internal provider failures, or any subsequent compromises originating
                directly from strictly third-party software, including hosting infrastructures and
                payment handling entities.
              </p>
            </div>

            <div>
              <h2
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  marginBottom: '16px',
                  fontFamily: 'Outfit, sans-serif',
                }}
              >
                9. Policy Changes
              </h2>
              <p>
                Backr reserves the unilateral right to dramatically update, restructure, amend, or
                rewrite this Privacy Policy inherently at any time, totally without pre-approval.
                Your continued presence and actions on the Backr platform conclusively form your
                acceptance of these eventual iterations.
              </p>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
