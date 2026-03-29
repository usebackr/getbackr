'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CreateCampaignForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    goalAmount: '',
    endDate: '',
    coverImageUrl: '',
  });

  // Fetch campaign data if in edit mode
  useEffect(() => {
    if (editId) {
      setFetching(true);
      fetch(`/api/campaigns/${editId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.campaign) {
            const c = data.campaign;
            setFormData({
              title: c.title || '',
              category: c.category || '',
              description: c.description || '',
              goalAmount: c.goalAmount ? parseFloat(c.goalAmount).toString() : '',
              endDate: c.endDate ? new Date(c.endDate).toISOString().split('T')[0] : '',
              coverImageUrl: c.coverImageUrl || '',
            });
          } else if (data.error) {
            setError(data.error);
          }
        })
        .catch(() => setError('Failed to load campaign data'))
        .finally(() => setFetching(false));
    }
  }, [editId]);

  const handleNext = () => setStep((s) => s + 1);
  const handlePrev = () => setStep((s) => s - 1);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', 'campaign');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setFormData({ ...formData, coverImageUrl: data.url });
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      setError('Upload failed. Check network connection.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.goalAmount || !formData.endDate) {
      setError('Please fill in all required fields (Title, Goal, and End Date)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // If editId exists, we are publishing/updating a draft
      const url = editId ? `/api/campaigns/${editId}` : '/api/campaigns/create';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          goalAmount: parseFloat(formData.goalAmount),
          status: 'active', // Ensure it becomes active when "Launched/Published"
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || `Failed to ${editId ? 'update' : 'create'} campaign`);
      } else {
        router.push(`/dashboard`);
      }
    } catch (err) {
      setError('A network error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', fontWeight: 800, color: 'var(--accent-secondary)' }}>
        Loading venture details...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 'clamp(20px, 5vw, 60px) 24px' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
            marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600
          }}
        >
          ← Back to Dashboard
        </button>

        <h1 style={{ fontSize: '2rem', marginBottom: '8px', fontWeight: 900 }}>
          {editId ? 'Finalize Your Venture' : 'Launch a Venture'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontWeight: 500 }}>Step {step} of 3</p>

        <div className="dash-card" style={{ padding: 'clamp(24px, 5vw, 40px)' }}>
          {error && (
            <div style={{ padding: '12px', background: '#fef2f2', color: '#ef4444', borderRadius: '10px', marginBottom: '24px', fontWeight: 600 }}>
              {error}
            </div>
          )}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '8px', fontWeight: 800 }}>Basic Venture Details</h2>
              <div>
                <label className="input-label">Campaign Title *</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. My Next Indie Film" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
              </div>
              <div>
                <label className="input-label">Category</label>
                <select name="category" value={formData.category} onChange={handleChange} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <option value="">Select a category</option>
                  <option value="Film & Video">🎬 Film & Video</option>
                  <option value="Music">🎵 Music</option>
                  <option value="Technology">💡 Technology</option>
                  <option value="Art & Design">🎨 Art & Design</option>
                  <option value="Games">🎮 Games</option>
                  <option value="Fashion">👗 Fashion</option>
                  <option value="Publishing">📚 Publishing</option>
                  <option value="Food & Craft">🍳 Food & Craft</option>
                </select>
              </div>
              <div>
                <label className="input-label">Short Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="What are you building?" rows={4} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', resize: 'vertical' }} />
              </div>
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={handleNext} disabled={!formData.title} className="btn-primary" style={{ padding: '14px 40px' }}>Next</button>
              </div>
            </div>
          )}

          {/* Step 2: Goal & Timeline */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '8px', fontWeight: 800 }}>Funding & Timeline</h2>
              <div>
                <label className="input-label">Amount Needed (₦) *</label>
                <input type="number" name="goalAmount" value={formData.goalAmount} onChange={handleChange} placeholder="e.g. 500000" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
              </div>
              <div>
                <label className="input-label">End Date *</label>
                <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} min={new Date().toISOString().split('T')[0]} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
              </div>
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={handlePrev} className="btn-secondary" style={{ padding: '14px 40px', background: '#f1f5f9', border: 'none' }}>Back</button>
                <button onClick={handleNext} disabled={!formData.goalAmount || !formData.endDate} className="btn-primary" style={{ padding: '14px 40px' }}>Next</button>
              </div>
            </div>
          )}

          {/* Step 3: Media */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '8px', fontWeight: 800 }}>Visual Identity</h2>
              <div>
                <label className="input-label">Venture Cover Image</label>
                <div 
                  onClick={() => document.getElementById('cover-upload')?.click()}
                  style={{ 
                    height: '240px', border: '2px dashed #cbd5e1', borderRadius: '24px', 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: formData.coverImageUrl ? `url(${formData.coverImageUrl}) center/cover no-repeat` : '#f8fafc',
                    cursor: 'pointer', overflow: 'hidden', position: 'relative'
                  }}
                >
                  {!formData.coverImageUrl && !uploading && <><span style={{ fontSize: '2rem', marginBottom: '12px' }}>🎞️</span><span style={{ fontWeight: 600, color: '#64748b' }}>Upload Campaign Cover</span></>}
                  {uploading && <div style={{ background: 'rgba(255,255,255,0.8)', padding: '12px 24px', borderRadius: '99px', fontWeight: 800 }}>Uploading...</div>}
                </div>
                <input type="file" id="cover-upload" style={{ display: 'none' }} accept="image/*" onChange={handleFileUpload} />
              </div>

              <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={handlePrev} className="btn-secondary" style={{ padding: '14px 40px', background: '#f1f5f9', border: 'none' }} disabled={loading}>Back</button>
                <button onClick={handleSubmit} className="btn-primary" style={{ padding: '14px 40px' }} disabled={loading || uploading}>
                  {loading ? 'Processing...' : editId ? 'Publish Changes' : 'Launch Campaign'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <style jsx>{`
        .input-label { display: block; margin-bottom: 8px; font-size: 0.9rem; font-weight: 700; color: #475569; }
      `}</style>
    </div>
  );
}

export default function CreateCampaignPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px', textAlign: 'center' }}>Loading...</div>}>
      <CreateCampaignForm />
    </Suspense>
  );
}
