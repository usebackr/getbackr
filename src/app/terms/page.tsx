import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function TermsPage() {
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
              Terms of Service
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
              These Terms of Service ("Terms") govern your access to and use of the Backr platform.
              By using Backr, you agree to be bound by these Terms completely and unambiguously.
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
                1. Platform Role Disclaimer
              </h2>
              <p>
                <strong>Backr is exclusively a technology platform</strong> that connects creators
                with supporters. Under no circumstances is Backr functioning as a financial
                institution, bank, or escrow service.
              </p>
              <ul style={{ paddingLeft: '24px', marginTop: '12px' }}>
                <li>Backr does not hold, manage, or take custody of user funds.</li>
                <li>Backr does not guarantee the success of any campaign.</li>
                <li>Backr does not verify all claims, promises, or statements made by creators.</li>
                <li>
                  Backr does not guarantee the delivery of promised outcomes, rewards, or projects.
                </li>
              </ul>
              <p style={{ marginTop: '12px', fontWeight: 600 }}>
                Backr holds zero responsibility for how raised funds are utilized by creators.
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
                2. Creator Responsibility
              </h2>
              <p>
                Creators bear sole and absolute liability for their campaigns. By creating a
                campaign on Backr, creators acknowledge they are strictly responsible for:
              </p>
              <ul style={{ paddingLeft: '24px', marginTop: '12px' }}>
                <li>The factual accuracy of all campaign content and claims.</li>
                <li>The lawful and transparent use of all funds received.</li>
                <li>The complete delivery of any promises or milestones stated.</li>
              </ul>
              <p style={{ marginTop: '12px' }}>
                Any misuse of funds, fraudulent statements, or failure to fulfill obligations is the
                strict responsibility of the creator. Backr is completely absolved of any liability
                arising from creator actions or omissions.
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
                3. Backer Responsibility
              </h2>
              <p>
                Backers explicitly acknowledge that they contribute funds entirely at their own
                risk. Backers are solely responsible for evaluating the legitimacy and feasibility
                of a campaign prior to contributing.
              </p>
              <p style={{ marginTop: '12px' }}>
                Backr does not guarantee refunds under any circumstances and does not obligate
                itself to mediate disputes between backers and creators.
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
                4. Payments Disclaimer
              </h2>
              <p>
                All financial transactions on the platform are processed efficiently by independent
                third-party payment providers (such as Paystack or Flutterwave). Backr does not
                store, intercept, or directly control user funds.
              </p>
              <p style={{ marginTop: '12px' }}>
                Backr assumes zero liability for payment processing failures, network delays,
                erroneous charges, or any errors strictly originating from third-party payment
                providers.
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
                5. No Refund Policy
              </h2>
              <p>
                By default, all contributions made on the Backr platform are strictly
                non-refundable. Backr is under no obligation to issue, facilitate, or force a refund
                on behalf of a creator. Any decisions regarding refunds are executed at Backr’s sole
                and absolute discretion.
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
                6. Fraud and Misuse
              </h2>
              <p>
                Backr retains the unchecked right to investigate any activity deemed suspicious. In
                the event of suspected fraud, Backr may unilaterally:
              </p>
              <ul style={{ paddingLeft: '24px', marginTop: '12px' }}>
                <li>Suspend or terminate accounts immediately.</li>
                <li>Restrict or legally freeze withdrawal capabilities.</li>
                <li>Remove campaigns without prior notice.</li>
              </ul>
              <p style={{ marginTop: '12px', fontWeight: 600 }}>
                Backr is not structurally or legally liable for any direct or indirect financial
                losses caused to users by fraudulent accounts.
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
                7. Withdrawal Control
              </h2>
              <p>
                To maintain platform integrity and comply with Anti-Money Laundering (AML)
                standards, Backr reserves the strict right to delay withdrawals, demand exhaustive
                KYC identity verification, and block withdrawals indefinitely in highly suspicious
                cases.
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
                8. Spending Log Disclaimer
              </h2>
              <p>
                The public spending logs displayed on campaign pages are entirely self-reported
                strictly by the creators. Backr does not independently audit, verify, or guarantee
                the factual accuracy of these entries. Backr bears absolute zero liability for
                inaccuracies or fabrications present in a creator's spending log.
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
                9. Limitation of Liability
              </h2>
              <p style={{ textTransform: 'uppercase', fontWeight: 700 }}>
                To the maximum extent permitted by applicable law, Backr shall not be liable for any
                direct, indirect, incidental, consequential, special, or exemplary damages arising
                out of your use of the platform.
              </p>
              <p style={{ marginTop: '12px' }}>
                Specifically, Backr explicitly distances itself from any liability regarding:
              </p>
              <ul style={{ paddingLeft: '24px', marginTop: '12px' }}>
                <li>Financial losses by either creator or backer.</li>
                <li>The partial or total failure of campaigns.</li>
                <li>The misuse, misappropriation, or theft of funds by creators.</li>
              </ul>
              <p style={{ marginTop: '12px', fontWeight: 600 }}>
                If held liable by a jurisdiction, Backr’s maximum cumulative liability shall be
                strictly limited to the actual platform fees paid to Backr by the specific user in
                the past twelve (12) months, or zero if legally permissible.
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
                10. Indemnification
              </h2>
              <p>
                You explicitly agree to indemnify, defend, and hold harmless Backr, its affiliates,
                directors, and employees, from and against any claims, damages, obligations, losses,
                liabilities, costs, or debt arising entirely from your use of the platform, your
                violation of these Terms, or your violation of any third-party rights.
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
                11. Account Termination
              </h2>
              <p>
                Backr unequivocally retains the right to suspend, limit, or permanently terminate
                any user account at its sole and absolute discretion, at any time, and completely
                without any obligation to provide a reason or prior notice.
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
                12. Modifications to Terms
              </h2>
              <p>
                Backr reserves the right to drastically modify, replace, or unilaterally alter these
                Terms at any time. Your continued utilization of the platform automatically
                constitutes your legally binding acceptance of the new Terms.
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
                13. Governing Law
              </h2>
              <p>
                These Terms shall be exclusively governed and construed in absolute accordance with
                the laws of the Federal Republic of Nigeria, without regard to its conflict of law
                provisions.
              </p>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
