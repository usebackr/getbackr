import React from 'react';

export default function TransparencySection() {
  const steps = [
    {
      title: 'Raise Funds',
      desc: 'Set your goal and start receiving contributions from your community.',
      icon: (
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--accent-primary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      ),
    },
    {
      title: 'Log Spending',
      desc: 'As you spend, log each expense with descriptions and categories.',
      icon: (
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--accent-primary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      ),
    },
    {
      title: 'Build Trust',
      desc: 'Backers see your progress and spending in real-time, building long-term loyalty.',
      icon: (
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--accent-primary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      ),
    },
  ];

  return (
    <section style={{ padding: 'var(--section-padding)', background: 'var(--bg-secondary)' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h2
            style={{
              fontSize: 'clamp(2.4rem, 5vw, 3.5rem)',
              marginBottom: '20px',
              color: 'var(--accent-secondary)',
            }}
          >
            Transparency as a <span style={{ color: 'var(--accent-primary)' }}>Feature.</span>
          </h2>
          <p
            style={{
              color: 'var(--text-secondary)',
              maxWidth: '640px',
              margin: '0 auto',
              fontSize: '1.1rem',
            }}
          >
            We've built a system that turns contributions into accountability. No more guessing
            where the money went.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '40px',
          }}
        >
          {steps.map((step, idx) => (
            <div key={idx} className="card" style={{ padding: '48px', textAlign: 'center' }}>
              <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'center' }}>
                {step.icon}
              </div>
              <h3
                style={{
                  fontSize: '1.6rem',
                  marginBottom: '20px',
                  color: 'var(--accent-secondary)',
                }}
              >
                {step.title}
              </h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
