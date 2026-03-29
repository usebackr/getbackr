'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function BetaSignupPage() {
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

  const categories = [
    { id: 'theatre', label: 'Theatre' },
    { id: 'concerts', label: 'Concerts' },
    { id: 'events', label: 'Events' },
    { id: 'art_exhibition', label: 'Art Exhibition' },
    { id: 'film_video', label: 'Film & Video' },
    { id: 'music', label: 'Music' },
    { id: 'photography', label: 'Photography' },
    { id: 'art_design', label: 'Art & Design' },
    { id: 'fashion', label: 'Fashion' },
    { id: 'podcasts', label: 'Podcasts' },
    { id: 'publishing', label: 'Publishing' },
    { id: 'food_craft', label: 'Food & Craft' },
    { id: 'comics', label: 'Comics' },
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
        body: JSON.stringify({ ...formData, role, interests, beta: true }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Something went wrong');
        return;
      }

      router.push(`/login?registered=true&beta=true`);
    } catch (err) {
      setError('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ 
      minHeight: '100vh', 
      background: '#0a0f1e', 
      color: '#f8fafc',
      fontFamily: "'Inter', sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background Orbs — Emerald Glow */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-10%',
        width: '50vw',
        height: '50vw',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '5%',
        right: '-10%',
        width: '40vw',
        height: '40vw',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 70%)',
        borderRadius: '50%',
        zIndex: 0
      }} />

      <div style={{ position: 'relative', zIndex: 1, padding: '40px 24px' }}>
        <nav style={{ 
          maxWidth: '1200px', 
          margin: '0 auto 80px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <h2 style={{ 
              fontSize: '1.8rem', 
              fontWeight: 900, 
              fontFamily: "'Outfit', sans-serif",
              background: 'linear-gradient(to right, #10b981, #34d399)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Backr<span style={{ color: '#fff' }}>.beta</span></h2>
          </a>
          <a href="/login" style={{ 
            color: '#94a3b8', 
            textDecoration: 'none', 
            fontSize: '0.9rem', 
            fontWeight: 500,
            padding: '8px 16px',
            borderRadius: '99px',
            border: '1px solid #1e293b',
            transition: 'all 0.2s'
          }}>Login</a>
        </nav>

        <div style={{ 
          maxWidth: '640px', 
          margin: '0 auto', 
          textAlign: 'center' 
        }}>
          <div style={{
            display: 'inline-block',
            padding: '6px 16px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '99px',
            color: '#10b981',
            fontSize: '0.8rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '24px'
          }}>
            Exclusive Early Access
          </div>
          
          <h1 style={{ 
            fontSize: 'clamp(2.5rem, 8vw, 4rem)', 
            fontWeight: 900, 
            fontFamily: "'Outfit', sans-serif",
            lineHeight: 1.1,
            marginBottom: '24px',
            letterSpacing: '-0.03em'
          }}>
            The Future of <span style={{ color: '#10b981' }}>Crowdfunding</span> starts here.
          </h1>
          
          <p style={{ 
            fontSize: '1.15rem', 
            color: '#94a3b8', 
            lineHeight: 1.6, 
            marginBottom: '48px',
            maxWidth: '520px',
            margin: '0 auto 48px'
          }}>
            Join the elite circle of creators and backers shaping the next generation of creative equity. Verified Beta access only.
          </p>

          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '32px',
            padding: '40px',
            textAlign: 'left',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            {step === 1 ? (
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: '8px' }}>Step 1: Your Profile</h3>
                <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '32px' }}>Choose how you'll participate in the Backr ecosystem.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                  {[
                    { id: 'individual', title: 'Independent Creator', icon: '🎨' },
                    { id: 'organization', title: 'Creative Collective / Studio', icon: '🏛️' }
                  ].map(r => (
                    <div 
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      style={{
                        padding: '20px',
                        borderRadius: '16px',
                        background: role === r.id ? 'rgba(16, 185, 129, 0.08)' : '#111827',
                        border: '2px solid',
                        borderColor: role === r.id ? '#10b981' : 'rgba(255,255,255,0.03)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                      }}
                    >
                      <span style={{ fontSize: '1.5rem' }}>{r.icon}</span>
                      <span style={{ fontWeight: 600, fontSize: '1rem', color: role === r.id ? '#fff' : '#94a3b8' }}>{r.title}</span>
                    </div>
                  ))}
                </div>

                <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '16px', color: '#94a3b8' }}>Areas of interest</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '40px' }}>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => toggleInterest(cat.id)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '99px',
                        background: interests.includes(cat.id) ? '#10b981' : 'rgba(255,255,255,0.05)',
                        border: 'none',
                        color: '#fff',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => setStep(2)}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '16px',
                    background: '#10b981',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '1rem',
                    fontFamily: "'Outfit', sans-serif",
                    cursor: 'pointer',
                    boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  Continue to Identity
                </button>
              </div>
            ) : (
              <form onSubmit={handleSignup}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: '8px' }}>Step 2: Security</h3>
                <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '32px' }}>Finalize your secure beta credentials.</p>

                {error && (
                  <div style={{ 
                    padding: '12px', 
                    background: 'rgba(239, 68, 68, 0.1)', 
                    color: '#ef4444', 
                    borderRadius: '12px', 
                    marginBottom: '24px',
                    fontSize: '0.9rem',
                    textAlign: 'center',
                    border: '1px solid rgba(239, 68, 68, 0.2)'
                  }}>
                    {error}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Full Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Enter legal name"
                      style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#0f172a', border: '1px solid #1e293b', color: '#fff', outline: 'none' }}
                      value={formData.displayName}
                      onChange={e => setFormData({...formData, displayName: e.target.value})}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Work Email</label>
                    <input 
                      type="email" 
                      required
                      placeholder="name@company.com"
                      style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#0f172a', border: '1px solid #1e293b', color: '#fff', outline: 'none' }}
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Create Secure Password</label>
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#0f172a', border: '1px solid #1e293b', color: '#fff', outline: 'none' }}
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Confirm Password</label>
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#0f172a', border: '1px solid #1e293b', color: '#fff', outline: 'none' }}
                      value={formData.confirmPassword}
                      onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', marginTop: '40px' }}>
                  <button 
                    type="button"
                    onClick={() => setStep(1)}
                    style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'transparent', color: '#94a3b8', border: '1px solid #1e293b', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Back
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    style={{ 
                      flex: 2, 
                      padding: '16px', 
                      borderRadius: '16px', 
                      background: '#10b981', 
                      color: '#fff', 
                      border: 'none', 
                      fontWeight: 700, 
                      fontFamily: "'Outfit', sans-serif",
                      cursor: 'pointer',
                      opacity: loading ? 0.7 : 1,
                      transition: 'all 0.2s',
                      boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    {loading ? 'Processing...' : 'Secure Access'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <footer style={{ marginTop: '80px', textAlign: 'center', color: '#475569', fontSize: '0.85rem' }}>
          &copy; 2026 Backr Collective. All rights reserved. Beta Phase 1.0
        </footer>
      </div>
    </main>
  );
}
