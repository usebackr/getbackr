'use client';

import React, { useState } from 'react';

const faqs = [
  {
    category: 'General',
    questions: [
      {
        q: 'What is Backr?',
        a: 'Backr is a platform that helps creators raise money from their audience and show how the funds are used through updates and spending logs.',
      },
      {
        q: 'How is Backr different from other crowdfunding platforms?',
        a: 'Backr focuses not just on raising money, but on what happens after. Creators can share updates and log how funds are used, making support more transparent.',
      },
      {
        q: 'Who is Backr for?',
        a: 'Backr is built for creators, including filmmakers, musicians, artists, writers, and creative communities.',
      },
    ],
  },
  {
    category: 'For Supporters',
    questions: [
      {
        q: 'How do I know my money is being used properly?',
        a: 'Creators can share updates and log how funds are used. Backr provides these tools, but supporters should review campaigns carefully before contributing.',
      },
      {
        q: 'Can I get a refund after contributing?',
        a: 'Contributions are generally not refundable. Once made, they go toward supporting the project.',
      },
      {
        q: 'Do I need an account to support a project?',
        a: 'You can contribute quickly, but having an account lets you track projects and receive updates.',
      },
      {
        q: 'Can I support anonymously?',
        a: 'Yes. You can choose not to display your name publicly.',
      },
    ],
  },
  {
    category: 'For Creators',
    questions: [
      {
        q: 'How do I start a campaign?',
        a: 'Create an account, set up your campaign with details and a funding goal, then publish and share your link.',
      },
      {
        q: 'When do I receive the money?',
        a: 'Payments are processed through third-party providers. Funds become available based on processing timelines and any required checks.',
      },
      {
        q: 'What fees does Backr charge?',
        a: 'Backr charges a percentage of funds raised. Payment providers also charge processing fees.',
      },
      {
        q: 'Can I edit my campaign after it’s live?',
        a: 'You can post updates and adjust some details, but certain fields may be restricted after funding begins.',
      },
    ],
  },
  {
    category: 'Trust & Safety',
    questions: [
      {
        q: 'Does Backr verify campaigns?',
        a: 'Backr may review campaigns or verify creators, but not all campaigns are independently verified. Supporters should use their own judgment.',
      },
      {
        q: 'What happens if a creator misuses funds?',
        a: 'Creators are responsible for how funds are used. Backr may review reports but does not guarantee outcomes.',
      },
      {
        q: 'Is my payment secure?',
        a: 'Yes. Payments are handled by trusted third-party providers.',
      },
      {
        q: 'Does Backr hold my money?',
        a: 'No. Payments are processed externally. Backr provides the platform and tracks activity.',
      },
    ],
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggleAccordion = (index: string) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      style={{ padding: '100px 24px', background: '#fafafa', borderTop: '1px solid #e2e8f0' }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h2
            style={{
              fontSize: '2.5rem',
              fontWeight: 900,
              color: '#0f172a',
              marginBottom: '16px',
              fontFamily: 'Outfit, sans-serif',
            }}
          >
            Frequently Asked Questions
          </h2>
          <p style={{ fontSize: '1.15rem', color: '#475569', fontWeight: 500 }}>
            Everything you need to know about the product and billing.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
          {faqs.map((section, sectionInt) => (
            <div key={section.category}>
              <h3
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '24px',
                  paddingBottom: '12px',
                  borderBottom: '2px solid #e2e8f0',
                }}
              >
                {section.category}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {section.questions.map((item, qInt) => {
                  const uniqueId = `${sectionInt}-${qInt}`;
                  const isOpen = openIndex === uniqueId;

                  return (
                    <div
                      key={uniqueId}
                      style={{
                        background: '#ffffff',
                        borderRadius: '12px',
                        border: isOpen ? '1px solid var(--accent-primary)' : '1px solid #e2e8f0',
                        overflow: 'hidden',
                        transition: 'all 0.2s',
                        boxShadow: isOpen ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                      }}
                    >
                      <button
                        onClick={() => toggleAccordion(uniqueId)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '24px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          outline: 'none',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '1.1rem',
                            fontWeight: 700,
                            color: isOpen ? 'var(--accent-primary)' : '#0f172a',
                            lineHeight: 1.4,
                            paddingRight: '24px',
                          }}
                        >
                          {item.q}
                        </span>
                        <span
                          style={{
                            color: isOpen ? 'var(--accent-primary)' : '#64748b',
                            fontSize: '1.5rem',
                            fontWeight: 300,
                            transition: 'transform 0.2s',
                            transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                          }}
                        >
                          +
                        </span>
                      </button>

                      {isOpen && (
                        <div
                          style={{
                            padding: '0 24px 24px',
                            color: '#475569',
                            fontSize: '1.05rem',
                            lineHeight: 1.6,
                            animation: 'fadeIn 0.3s ease-in-out',
                          }}
                        >
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}
