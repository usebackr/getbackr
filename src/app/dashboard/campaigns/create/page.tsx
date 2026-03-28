'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    goalAmount: '',
    endDate: '',
    coverImageUrl: '',
  });

  const handleNext = () => setStep((s) => s + 1);
  const handlePrev = () => setStep((s) => s - 1);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.goalAmount || !formData.endDate) {
      setError('Please fill in all required fields (Title, Goal, and End Date)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/campaigns/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          goalAmount: parseFloat(formData.goalAmount),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create campaign');
      } else {
        router.push(`/dashboard`);
      }
    } catch (err) {
      setError('A network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 24px' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          ← Back to Dashboard
        </button>

        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Create a New Venture</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Step {step} of 3</p>

        <div className="card" style={{ padding: '32px' }}>
          {error && (
            <div
              style={{
                padding: '12px',
                background: '#fef2f2',
                color: '#ef4444',
                borderRadius: '8px',
                marginBottom: '24px',
              }}
            >
              {error}
            </div>
          )}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Basic Details</h2>

              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Campaign Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. A Modern Indie Short Film"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <option value="">Select a category</option>
                  <option value="Film & Video">🎬 Film &amp; Video</option>
                  <option value="Music">🎵 Music</option>
                  <option value="Theatre">🎭 Theatre</option>
                  <option value="Art & Design">🎨 Art &amp; Design</option>
                  <option value="Games">🎮 Games</option>
                  <option value="Technology">💡 Technology</option>
                  <option value="Fashion">👗 Fashion</option>
                  <option value="Publishing">📚 Publishing</option>
                  <option value="Food & Craft">🍳 Food &amp; Craft</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Short Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Tell backers what exactly you're building..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleNext}
                  disabled={!formData.title}
                  className="btn-primary"
                  style={{ padding: '12px 24px' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Goal & Timeline */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Funding Goal</h2>

              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Amount Needed (₦) *
                </label>
                <input
                  type="number"
                  name="goalAmount"
                  value={formData.goalAmount}
                  onChange={handleChange}
                  placeholder="e.g. 500000"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  End Date *
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                  }}
                />
              </div>

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
                <button
                  onClick={handlePrev}
                  className="btn-secondary"
                  style={{ padding: '12px 24px', background: '#f1f5f9', border: 'none' }}
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!formData.goalAmount || !formData.endDate}
                  className="btn-primary"
                  style={{ padding: '12px 24px' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Media */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Cover Media</h2>

              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Cover Image URL
                </label>
                <input
                  type="url"
                  name="coverImageUrl"
                  value={formData.coverImageUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                  }}
                />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  (For the demo, paste an image link. Direct file uploads require S3 configuration).
                </p>
              </div>

              {formData.coverImageUrl && (
                <div
                  style={{
                    width: '100%',
                    height: '200px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: '#f1f5f9',
                  }}
                >
                  <img
                    src={formData.coverImageUrl}
                    alt="Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                </div>
              )}

              <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'space-between' }}>
                <button
                  onClick={handlePrev}
                  className="btn-secondary"
                  style={{ padding: '12px 24px', background: '#f1f5f9', border: 'none' }}
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  className="btn-primary"
                  style={{ padding: '12px 24px' }}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Launch Campaign'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
