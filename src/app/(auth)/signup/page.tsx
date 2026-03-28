'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [role, setRole] = React.useState('individual');
  const [interests, setInterests] = React.useState<string[]>([]);

  const [formData, setFormData] = React.useState({
    displayName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  // Creator-centric categories as requested
  const categories = [
    { id: 'music', label: 'Music & Sound', icon: '🎵' },
    { id: 'dance', label: 'Dance & Performance', icon: '💃' },
    { id: 'art', label: 'Visual Arts', icon: '🎨' },
    { id: 'cinema', label: 'Film & Cinema', icon: '🎬' },
    { id: 'poetry', label: 'Poetry & Writing', icon: '✍️' },
    { id: 'theater', label: 'Theater', icon: '🎭' },
    { id: 'content', label: 'Digital Content', icon: '📸' },
    { id: 'other', label: 'Creative Works', icon: '✨' },
  ];

  const toggleInterest = (id: string) => {
    setInterests((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role, interests }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Something went wrong');
        return;
      }

      // Registration succeeded — go to login
      router.push(`/login?registered=true`);
    } catch (err) {
      setError('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#f8fafc',
      }}
    >
      <nav style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
        <div
          className="container"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <a href="/" style={{ textDecoration: 'none' }}>
            <h2 className="text-gradient" style={{ fontSize: '1.8rem', fontWeight: 900 }}>
              Backr
            </h2>
          </a>
          <a
            href="/login"
            style={{
              color: 'var(--text-primary)',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            Already have an account? <span style={{ color: 'var(--accent-primary)' }}>Login</span>
          </a>
        </div>
      </nav>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 24px',
        }}
      >
        <div
          className="card"
          style={{
            maxWidth: '640px',
            width: '100%',
            background: '#ffffff',
            padding: 'clamp(32px, 8vw, 64px)',
            boxShadow: '0 40px 100px rgba(15, 23, 42, 0.05)',
          }}
        >
          {step === 1 && (
            <div>
              <h2
                style={{
                  fontSize: '2.5rem',
                  marginBottom: '16px',
                  color: 'var(--accent-secondary)',
                }}
              >
                Start your <span style={{ color: 'var(--accent-primary)' }}>Backr</span> adventure
                now!
              </h2>

              <div style={{ marginBottom: '48px' }}>
                <p style={{ fontWeight: 800, marginBottom: '24px', fontSize: '1.1rem' }}>
                  Your Journey Type
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[
                    {
                      id: 'individual',
                      title: 'Independent Creator',
                      desc: 'I create Music, Art, or Film and am looking to raise funds for my vision.',
                    },
                    {
                      id: 'organization',
                      title: 'Creative Collective',
                      desc: 'A group or organization dedicated to the creative arts.',
                    },
                  ].map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setRole(item.id)}
                      style={{
                        padding: '24px',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: '2px solid',
                        borderColor: role === item.id ? 'var(--accent-primary)' : '#f1f5f9',
                        background: role === item.id ? 'rgba(255, 122, 0, 0.02)' : '#f8fafc',
                      }}
                    >
                      <h4
                        style={{
                          fontSize: '1.1rem',
                          fontWeight: 800,
                          marginBottom: '4px',
                          color: role === item.id ? 'var(--accent-primary)' : 'inherit',
                        }}
                      >
                        {item.title}
                      </h4>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '48px' }}>
                <p style={{ fontWeight: 800, marginBottom: '24px', fontSize: '1.1rem' }}>
                  What's your craft?
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => toggleInterest(cat.id)}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '99px',
                        border: '1px solid',
                        borderColor: interests.includes(cat.id)
                          ? 'var(--accent-primary)'
                          : '#e2e8f0',
                        background: interests.includes(cat.id)
                          ? 'var(--accent-primary)'
                          : 'transparent',
                        color: interests.includes(cat.id) ? '#ffffff' : 'var(--text-primary)',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s',
                      }}
                    >
                      <span>{cat.icon}</span> {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                className="btn-primary"
                style={{ width: '100%', padding: '18px' }}
                onClick={() => setStep(2)}
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2
                style={{
                  fontSize: '2.5rem',
                  marginBottom: '8px',
                  color: 'var(--accent-secondary)',
                }}
              >
                Welcome
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '40px' }}>
                Provide your identity to get started.
              </p>

              {error && (
                <div
                  style={{
                    padding: '12px',
                    background: '#fee2e2',
                    color: '#dc2626',
                    borderRadius: '8px',
                    marginBottom: '24px',
                    fontSize: '0.9rem',
                    textAlign: 'center',
                  }}
                >
                  {error}
                </div>
              )}

              <form
                onSubmit={handleSignup}
                style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                    }}
                  >
                    Full name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    style={{
                      width: '100%',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      outline: 'none',
                    }}
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                    }}
                  >
                    Email address
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    style={{
                      width: '100%',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      outline: 'none',
                    }}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                    }}
                  >
                    Phone number
                  </label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div
                      style={{
                        padding: '16px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        background: '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span>🇳🇬</span> +234
                    </div>
                    <input
                      type="tel"
                      placeholder="812 345 6789"
                      style={{
                        flex: 1,
                        padding: '16px',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        outline: 'none',
                      }}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                      }}
                    >
                      Password
                    </label>
                    <input
                      type="password"
                      placeholder="Create password"
                      style={{
                        width: '100%',
                        padding: '16px',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        outline: 'none',
                      }}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                      }}
                    >
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      placeholder="Confirm password"
                      style={{
                        width: '100%',
                        padding: '16px',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        outline: 'none',
                      }}
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({ ...formData, confirmPassword: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                    marginTop: '12px',
                  }}
                >
                  <input type="checkbox" style={{ marginTop: '4px' }} required />
                  <p
                    style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}
                  >
                    By continuing, you agree to Backr's{' '}
                    <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>
                      Terms and conditions
                    </span>
                    , and{' '}
                    <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>
                      Privacy policy
                    </span>
                    .
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => setStep(1)}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ flex: 2 }}
                    disabled={loading}
                  >
                    {loading ? 'Creating Identity...' : 'Register'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
