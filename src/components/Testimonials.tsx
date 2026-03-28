import React from 'react';

export default function Testimonials() {
  const reviews = [
    {
      name: 'Babatunde Lawal',
      role: 'Filmmaker (Lagos)',
      text: 'Backr changed how I interact with my community. Real-time spending logs built a level of trust that allowed me to raise 2x more than my initial goal.',
      avatar:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
    },
    {
      name: 'Aisha Bello',
      role: 'Agri-Tech Founder (Kano)',
      text: 'The transparency tool is brilliant. My backers feel like partners in the build process, and it keeps our team accountable for every naira spent.',
      avatar:
        'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=150',
    },
    {
      name: 'Chinedu Okafor',
      role: 'Hardware Developer (Enugu)',
      text: 'I used to hesitate to back projects on other platforms. With Backr, I feel 100% confident knowing exactly how my contribution is being spent.',
      avatar:
        'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&q=80&w=150',
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
              <div style={{ position: 'absolute', top: '-24px', left: '32px' }}>
                <img
                  src={review.avatar}
                  alt={review.name}
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    border: '4px solid #ffffff',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                    objectFit: 'cover',
                  }}
                />
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
                "{review.text}"
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
