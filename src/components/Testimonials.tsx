import React from 'react';

export default function Testimonials() {
  const reviews = [
    {
      name: 'Babatunde Lawal',
      role: 'Independent Filmmaker',
      text: 'Backr changed how I interact with my community. Real-time spending logs built a level of trust that allowed me to raise 2x more than my initial goal.',
      iconBg: '#ecfdf5',
      iconColor: '#10b981',
    },
    {
      name: 'Aisha Bello',
      role: 'Visual Artist & Curator',
      text: 'The transparency tool is brilliant. My backers feel like partners in the build process, and it keeps our team accountable for every naira spent.',
      iconBg: '#eff6ff',
      iconColor: '#3b82f6',
    },
    {
      name: 'Chinedu Okafor',
      role: 'Independent Musician',
      text: 'I used to hesitate to back projects on other platforms. With Backr, I feel 100% confident knowing exactly how my contribution is being spent.',
      iconBg: '#f5f3ff',
      iconColor: '#8b5cf6',
    },
  ];

  return (
    <section style={{ padding: 'var(--section-padding)', background: 'var(--bg-secondary)' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h2
            style={{
              fontSize: 'clamp(2.2rem, 5vw, 3rem)',
              marginBottom: '16px',
              color: 'var(--accent-secondary)',
            }}
          >
            Trusted by <span className="text-gradient">Visionaries.</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            Hear from those who are already redefining creator-backer trust in Nigeria.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '40px',
          }}
        >
          {reviews.map((review, idx) => (
            <div
              key={idx}
              className="card"
              style={{
                padding: 'clamp(32px, 5vw, 48px)',
                position: 'relative',
                background: '#ffffff',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '-24px',
                  left: '32px',
                  width: '56px',
                  height: '56px',
                  borderRadius: '18px', // Slightly rounded square for modern look
                  border: '4px solid #ffffff',
                  background: review.iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={review.iconColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <p
                style={{
                  marginTop: '16px',
                  fontSize: '1.05rem',
                  color: 'var(--text-primary)',
                  fontWeight: 500,
                  lineHeight: 1.7,
                  marginBottom: '24px',
                }}
              >
                &quot;{review.text}&quot;
              </p>
              <div>
                <h4
                  style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-secondary)' }}
                >
                  {review.name}
                </h4>
                <p
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--accent-primary)',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                  }}
                >
                  {review.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
