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
    status: 'draft',
  });

  const [uploadProgress, setUploadProgress] = useState(0);

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
              status: c.status || 'draft',
            });
          } else if (data.error) {
            setError(data.error);
          }
        })
        .catch(() => setError('Failed to load campaign data'))
        .finally(() => setFetching(false));
    }
  }, [editId]);

  const handleNext = async () => {
    // Auto-save after Step 1 if it's a new campaign
    if (step === 1 && !editId) {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/campaigns/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formData.title,
            category: formData.category,
            description: formData.description,
            status: 'draft',
          }),
        });
        const data = await res.json();
        if (res.ok && data.campaign) {
          // Update URL with newly created campaign ID without reloading
          const newUrl = `${window.location.pathname}?id=${data.campaign.id}`;
          window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
          // We can't use router.replace easily without a potential re-fetch flash, 
          // but updating the ID in state or URL ensures next steps use PUT.
          setStep(2);
        } else {
          setError(data.error || 'Failed to auto-save draft. Please try again.');
        }
      } catch (err) {
        setError('Connection error. Failed to save draft.');
      } finally {
        setLoading(false);
      }
      return;
    }
    setStep((s) => s + 1);
  };
  const handlePrev = () => setStep((s) => s - 1);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1MB Limit check
    if (file.size > 1024 * 1024) {
      setError('File size exceeds 1MB limit. Please upload a smaller image.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');

    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', 'campaign');

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload', true);
    xhr.withCredentials = true; // Send the accessToken cookie

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      setUploading(false);
      if (xhr.status === 200) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.url) {
            setFormData({ ...formData, coverImageUrl: data.url });
          }
        } catch (e) {
          setError('Failed to parse upload response');
        }
      } else {
        try {
          const data = JSON.parse(xhr.responseText);
          setError(data.error || 'Upload failed');
        } catch (e) {
          setError(`Upload failed with status ${xhr.status}`);
        }
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      setError('Upload failed. Check network connection.');
    };

    xhr.send(fd);
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
        Loading project details...
      </div>
    );
  }

  const isStep1Valid = formData.title.length > 5 && formData.description.length >= 100;

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
          {editId ? 'Finalize Your Project' : 'Launch a Project'}
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
              <h2 style={{ fontSize: '1.25rem', marginBottom: '8px', fontWeight: 800 }}>Basic Project Details</h2>
              <div>
                <label className="input-label">Project Title *</label>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="input-label" style={{ marginBottom: 0 }}>Short Description *</label>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: formData.description.length < 100 ? '#ef4444' : '#059669' }}>
                    {formData.description.length} / 100 min characters
                  </span>
                </div>
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Describe your project in detail (min 100 characters)..." rows={5} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: `1px solid ${formData.description.length < 100 && formData.description.length > 0 ? '#ef4444' : '#e2e8f0'}`, resize: 'vertical' }} />
                {formData.description.length > 0 && formData.description.length < 100 && (
                  <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', fontWeight: 600 }}>Please add {100 - formData.description.length} more characters to continue.</p>
                )}
              </div>
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={handleNext} disabled={!isStep1Valid} className="btn-primary" style={{ padding: '14px 40px', opacity: !isStep1Valid ? 0.5 : 1 }}>Next</button>
              </div>
            </div>
          )}

          {/* Step 2: Goal & Timeline */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '8px', fontWeight: 800 }}>Funding & Timeline</h2>
              <div>
                <label className="input-label">Amount Needed (₦) *</label>
                <input 
                  type="number" 
                  name="goalAmount" 
                  value={formData.goalAmount} 
                  onChange={handleChange} 
                  placeholder="e.g. 500000" 
                  disabled={formData.status === 'active'}
                  style={{ 
                    width: '100%', 
                    padding: '14px', 
                    borderRadius: '12px', 
                    border: '1px solid #e2e8f0',
                    background: formData.status === 'active' ? '#f1f5f9' : '#fff',
                    cursor: formData.status === 'active' ? 'not-allowed' : 'text'
                  }} 
                />
                {formData.status === 'active' && (
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px', fontWeight: 600 }}>
                    Project is live. Funding goal cannot be changed to protect donor trust.
                  </p>
                )}
              </div>
              <div>
                <label className="input-label">End Date *</label>
                <input 
                  type="date" 
                  name="endDate" 
                  value={formData.endDate} 
                  onChange={handleChange} 
                  min={new Date().toISOString().split('T')[0]} 
                  disabled={formData.status === 'active'}
                  style={{ 
                    width: '100%', 
                    padding: '14px', 
                    borderRadius: '12px', 
                    border: '1px solid #e2e8f0',
                    background: formData.status === 'active' ? '#f1f5f9' : '#fff',
                    cursor: formData.status === 'active' ? 'not-allowed' : 'text'
                  }} 
                />
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Visual Identity</h2>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Max size: 1MB</span>
              </div>
              <div>
                <label className="input-label">Project Cover Image *</label>
                <div 
                  onClick={() => !uploading && document.getElementById('cover-upload')?.click()}
                  style={{ 
                    height: '240px', border: '2px dashed #cbd5e1', borderRadius: '24px', 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: formData.coverImageUrl ? `url(${formData.coverImageUrl}) center/cover no-repeat` : '#f8fafc',
                    cursor: uploading ? 'not-allowed' : 'pointer', overflow: 'hidden', position: 'relative'
                  }}
                >
                  {!formData.coverImageUrl && !uploading && <><span style={{ fontSize: '2rem', marginBottom: '12px' }}>🎞️</span><span style={{ fontWeight: 600, color: '#64748b' }}>Upload Project Cover</span></>}
                  
                  {uploading && (
                    <div style={{ background: 'rgba(255,255,255,0.9)', padding: '24px', borderRadius: '20px', width: '80%', textAlign: 'center' }}>
                      <p style={{ fontWeight: 800, marginBottom: '12px', color: 'var(--accent-primary)' }}>Uploading... {uploadProgress}%</p>
                      <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--accent-primary)', transition: 'width 0.2s' }}></div>
                      </div>
                    </div>
                  )}
                  {formData.coverImageUrl && !uploading && (
                    <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                      Change Image
                    </div>
                  )}
                </div>
                <input type="file" id="cover-upload" style={{ display: 'none' }} accept="image/*" onChange={handleFileUpload} />
              </div>

              <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={handlePrev} className="btn-secondary" style={{ padding: '14px 40px', background: '#f1f5f9', border: 'none' }} disabled={loading}>Back</button>
                <button onClick={handleSubmit} className="btn-primary" style={{ padding: '14px 40px' }} disabled={loading || uploading || !formData.coverImageUrl}>
                  {loading ? 'Processing...' : editId ? 'Publish Changes' : 'Launch Project'}
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
