'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>({
    displayName: '',
    email: '',
    bio: '',
    category: '',
    username: '',
    avatarUrl: '',
    socialLinks: {
      twitter: '',
      instagram: '',
      linkedin: '',
      website: ''
    }
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetch('/api/user/profile')
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setProfile({
            displayName: data.user.displayName || '',
            email: data.user.email || '',
            bio: data.user.bio || '',
            category: data.user.category || '',
            username: data.user.username || '',
            avatarUrl: data.user.avatarUrl || '',
            socialLinks: data.user.socialLinks || {
              twitter: '',
              instagram: '',
              linkedin: '',
              website: ''
            }
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', 'profile');

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload', true);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setUploadProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      setUploading(false);
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        if (data.url) {
          setProfile((prev: any) => ({ ...prev, avatarUrl: data.url }));
        }
      }
    };
    xhr.send(fd);
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess('');
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (res.ok) setSuccess('Profile updated successfully!');
    } finally {
      setSaving(false);
    }
  };

  const categories = [
    'Film & Video', 'Music', 'Theatre', 'Art & Design', 'Games', 'Technology', 'Fashion', 'Publishing', 'Food & Craft'
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar />
      <main className="dash-main" style={{ flex: 1 }}>
        <header style={{ marginBottom: '40px' }}>
          <button
            onClick={() => window.location.href = '/dashboard'}
            style={{
              background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
              marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600,
              padding: '0', fontSize: '0.9rem'
            }}
          >
            ← Back to Dashboard
          </button>
          <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', marginBottom: '4px', fontWeight: 900 }}>My Profile</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 500 }}>
             How the world sees you as a creator
          </p>
        </header>

        {loading ? (
          <p>Loading your identity...</p>
        ) : (
          <div style={{ maxWidth: '1000px' }}>
            {/* Trust Tip Banner */}
            <div className="glass" style={{ 
              padding: '20px 24px', 
              borderRadius: '20px', 
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
              color: '#fff',
              marginBottom: '32px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              boxShadow: '0 10px 20px rgba(16, 185, 129, 0.2)'
            }}>
              <div style={{ fontSize: '1.5rem' }}>💡</div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '2px' }}>Trust is Everything</h3>
                <p style={{ fontSize: '0.85rem', opacity: 0.9, fontWeight: 600 }}>
                  The more information you share, the more backers trust you. Projects with complete social profiles are twice as likely to reach their goal.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
              {/* Profile Card */}
              <div className="dash-card">
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px' }}>Public Identity</h3>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
                  <div 
                    onClick={() => !uploading && document.getElementById('avatar-upload')?.click()}
                    style={{ 
                      width: '100px', 
                      height: '100px', 
                      borderRadius: '50%', 
                      background: profile.avatarUrl ? `url(${profile.avatarUrl}) center/cover` : 'var(--accent-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      border: '4px solid #fff',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {!profile.avatarUrl && <span style={{ color: '#fff', fontSize: '2rem', fontWeight: 900 }}>{profile.displayName?.charAt(0) || '?'}</span>}
                    {uploading && (
                       <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>
                          {uploadProgress}%
                       </div>
                    )}
                  </div>
                  <div>
                    <button 
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                      className="btn-secondary" 
                      style={{ padding: '8px 16px', fontSize: '0.8rem', background: '#f1f5f9', border: 'none' }}
                    >
                      Update Avatar
                    </button>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '8px', fontWeight: 600 }}>JPG or PNG. Max 1MB.</p>
                  </div>
                  <input type="file" id="avatar-upload" style={{ display: 'none' }} accept="image/*" onChange={handleFileUpload} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label className="input-label">Display Name</label>
                    <input type="text" value={profile.displayName} onChange={(e) => setProfile({ ...profile, displayName: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                  </div>
                  <div>
                    <label className="input-label">Username</label>
                    <input type="text" value={profile.username} onChange={(e) => setProfile({ ...profile, username: e.target.value })} placeholder="@username" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                  </div>
                  <div>
                    <label className="input-label">Creative Category</label>
                    <select value={profile.category} onChange={(e) => setProfile({ ...profile, category: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <option value="">Select your craft...</option>
                      {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="input-label">Bio</label>
                    <textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={4} placeholder="Describe your journey..." style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', resize: 'none' }} />
                  </div>
                </div>
              </div>

              {/* Social Links Card */}
              <div className="dash-card">
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px' }}>Social Profiles</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '24px', fontWeight: 500 }}>
                   Link your active profiles to build credibility and let donors connect with your work.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                   {[
                     { key: 'twitter', label: 'Twitter/X URL', placeholder: 'https://twitter.com/...' },
                     { key: 'instagram', label: 'Instagram URL', placeholder: 'https://instagram.com/...' },
                     { key: 'linkedin', label: 'LinkedIn URL', placeholder: 'https://linkedin.com/in/...' },
                     { key: 'website', label: 'Personal Website', placeholder: 'https://...' },
                   ].map((social) => (
                     <div key={social.key}>
                       <label className="input-label">{social.label}</label>
                       <input 
                         type="url" 
                         value={profile.socialLinks?.[social.key] || ''} 
                         onChange={(e) => setProfile({ 
                           ...profile, 
                           socialLinks: { ...profile.socialLinks, [social.key]: e.target.value } 
                         })} 
                         placeholder={social.placeholder} 
                         style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} 
                       />
                     </div>
                   ))}
                </div>

                {success && (
                  <div style={{ marginTop: '24px', padding: '12px', background: '#ecfdf5', color: '#10b981', borderRadius: '10px', fontWeight: 700, textAlign: 'center' }}>
                     {success}
                  </div>
                )}

                <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ padding: '14px 40px', fontSize: '1rem' }}>
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
