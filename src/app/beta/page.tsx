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
  const [success, setSuccess] = React.useState(false);
  const [registeredName, setRegisteredName] = React.useState('');

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

      // Show success screen instead of redirecting
      setRegisteredName(formData.displayName.split(' ')[0]);
      setSuccess(true);
    } catch (err) {
      setError('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  // ── Success Screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <main style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ maxWidth: '520px', width: '100%', textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', background: '#f0fdf4', border: '2px solid #10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', fontSize: '2.5rem' }}>
            🎉
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.04em', marginBottom: '16px' }}>
            You're in, {registeredName}!
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#475569', lineHeight: 1.6, marginBottom: '12px' }}>
            Thank you for joining the Backr Beta.
          </p>
          <p style={{ fontSize: '1rem', color: '#64748b', lineHeight: 1.6, marginBottom: '40px' }}>
            We're putting the final touches on the platform. We'll reach out to you personally as soon as it's ready — you'll be among the very first to get in.
          </p>
          <div style={{ padding: '20px 24px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', marginBottom: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04)' }}>
            <p style={{ margin: '0 0 6px', fontSize: '0.9rem', color: '#64748b' }}>
              We've sent a welcome note to <strong style={{ color: '#0f172a' }}>{formData.email}</strong>.
            </p>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
              Can't find it? Check your <strong style={{ color: '#475569' }}>spam / junk folder</strong> — it may have landed there.
            </p>
          </div>
          <a href="/" style={{ display: 'inline-block', padding: '14px 32px', background: '#0f172a', color: '#fff', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, fontFamily: "'Outfit', sans-serif", fontSize: '0.95rem' }}>
            Back to Home
          </a>
        </div>
      </main>
    );
  }

  return (
    <main style={{ 
      minHeight: '100vh', 
      background: '#f8fafc', 
      color: '#0f172a',
      fontFamily: "'Inter', sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background Orbs — Emerald Glow (Adjusted for light mode) */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-10%',
        width: '50vw',
        height: '50vw',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 70%)',
        borderRadius: '50%',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '5%',
        right: '-10%',
        width: '40vw',
        height: '40vw',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.03) 0%, transparent 70%)',
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
              background: 'linear-gradient(to right, #10b981, #059669)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Backr<span style={{ color: '#0f172a' }}>.beta</span></h2>
          </a>
          <a href="/login" style={{ 
            color: '#64748b', 
            textDecoration: 'none', 
            fontSize: '0.9rem', 
            fontWeight: 600,
            padding: '8px 20px',
            borderRadius: '99px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
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
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.15)',
            borderRadius: '99px',
            color: '#059669',
            fontSize: '0.75rem',
            fontWeight: 800,
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
            letterSpacing: '-0.04em',
            color: '#0f172a'
          }}>
            The Future of <span style={{ color: '#10b981' }}>Crowdfunding</span> starts here.
          </h1>
          
          <p style={{ 
            fontSize: '1.15rem', 
            color: '#475569', 
            lineHeight: 1.6, 
            marginBottom: '48px',
            maxWidth: '520px',
            margin: '0 auto 48px'
          }}>
            Join the elite circle of creators and backers shaping the next generation of creative equity. Verified Beta access only.
          </p>

          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '32px',
            padding: '40px',
            textAlign: 'left',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)'
          }}>
            {step === 1 ? (
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif", marginBottom: '8px', color: '#0f172a' }}>Step 1: Your Profile</h3>
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
                        background: role === r.id ? '#f0fdf4' : '#f8fafc',
                        border: '2px solid',
                        borderColor: role === r.id ? '#10b981' : '#f1f5f9',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                      }}
                    >
                      <span style={{ fontSize: '1.5rem' }}>{r.icon}</span>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: role === r.id ? '#065f46' : '#475569' }}>{r.title}</span>
                    </div>
                  ))}
                </div>

                <p style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '16px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Areas of interest</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '40px' }}>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => toggleInterest(cat.id)}
                      style={{
                        padding: '8px 18px',
                        borderRadius: '99px',
                        background: interests.includes(cat.id) ? '#10b981' : '#f1f5f9',
                        border: 'none',
                        color: interests.includes(cat.id) ? '#ffffff' : '#475569',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s'
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
                    padding: '18px',
                    borderRadius: '16px',
                    background: '#10b981',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '1rem',
                    fontFamily: "'Outfit', sans-serif",
                    cursor: 'pointer',
                    boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.25)',
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
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif", marginBottom: '8px', color: '#0f172a' }}>Step 2: Security</h3>
                <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '32px' }}>Finalize your secure beta credentials.</p>

                {error && (
                  <div style={{ 
                    padding: '12px', 
                    background: '#fef2f2', 
                    color: '#ef4444', 
                    borderRadius: '12px', 
                    marginBottom: '24px',
                    fontSize: '0.9rem',
                    textAlign: 'center',
                    border: '1px solid #fee2e2'
                  }}>
                    {error}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 700 }}>Full Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Enter legal name"
                      style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', outline: 'none', transition: 'border-color 0.2s' }}
                      value={formData.displayName}
                      onChange={e => setFormData({...formData, displayName: e.target.value})}
                      onFocus={(e) => e.target.style.borderColor = '#10b981'}
                      onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 700 }}>Work Email</label>
                    <input 
                      type="email" 
                      required
                      placeholder="name@company.com"
                      style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', outline: 'none', transition: 'border-color 0.2s' }}
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      onFocus={(e) => e.target.style.borderColor = '#10b981'}
                      onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 700 }}>Create Secure Password</label>
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', outline: 'none', transition: 'border-color 0.2s' }}
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      onFocus={(e) => e.target.style.borderColor = '#10b981'}
                      onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 700 }}>Confirm Password</label>
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', outline: 'none', transition: 'border-color 0.2s' }}
                      value={formData.confirmPassword}
                      onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                      onFocus={(e) => e.target.style.borderColor = '#10b981'}
                      onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', marginTop: '40px' }}>
                  <button 
                    type="button"
                    onClick={() => setStep(1)}
                    style={{ flex: 1, padding: '16px', borderRadius: '16px', background: '#ffffff', color: '#64748b', border: '1px solid #e2e8f0', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
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
                      fontWeight: 800, 
                      fontFamily: "'Outfit', sans-serif",
                      cursor: 'pointer',
                      opacity: loading ? 0.7 : 1,
                      transition: 'all 0.2s',
                      boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.25)'
                    }}
                  >
                    {loading ? 'Processing...' : 'Secure Access'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <footer style={{ marginTop: '80px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
          &copy; 2026 Backr Collective. All rights reserved. Beta Phase 1.0
        </footer>
      </div>
    </main>
  );
}
