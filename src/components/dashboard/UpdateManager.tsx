'use client';

import React from 'react';
import { Megaphone, Plus, MessageSquare, Calendar, Image as ImageIcon } from 'lucide-react';

interface CampaignUpdate {
  id: string;
  title: string;
  body: string;
  mediaUrl: string | null;
  createdAt: string;
}

interface UpdateManagerProps {
  campaignId: string;
}

export default function UpdateManager({ campaignId }: UpdateManagerProps) {
  const [updates, setUpdates] = React.useState<CampaignUpdate[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  // Form state
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [mediaUrl, setMediaUrl] = React.useState('');

  React.useEffect(() => {
    fetchUpdates();
  }, [campaignId]);

  const fetchUpdates = async () => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/updates`);
      const data = await res.json();
      setUpdates(data.updates || []);
    } catch (error) {
      console.error('Failed to fetch updates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body,
          mediaUrl: mediaUrl || undefined,
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setTitle('');
        setBody('');
        setMediaUrl('');
        fetchUpdates();
      }
    } catch (error) {
      console.error('Failed to post update:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading project updates...</div>;
  }

  return (
    <div style={{ background: '#fff', borderRadius: '32px', border: '1px solid #e2e8f0', padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>Project Updates</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Keep your backers engaged with milestones and announcements</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '14px',
              background: 'var(--accent-primary)',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Plus size={18} /> Post New Update
          </button>
        )}
      </div>

      {showForm && (
        <form 
          onSubmit={handleSubmit}
          style={{ 
            background: '#f8fafc', 
            padding: '24px', 
            borderRadius: '24px', 
            border: '1px solid #e2e8f0',
            marginBottom: '32px'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Update Title</label>
              <input 
                required
                placeholder="e.g. Production just started!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Content</label>
              <textarea 
                required
                rows={5}
                placeholder="Share the exciting news with your supporters..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', resize: 'vertical' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Image URL (Optional)</label>
              <input 
                type="url"
                placeholder="https://example.com/photo.jpg"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifySelf: 'flex-end', gap: '12px' }}>
            <button 
              type="button" 
              onClick={() => setShowForm(false)} 
              style={{ padding: '10px 20px', borderRadius: '12px', background: 'none', border: '1px solid #e2e8f0', fontWeight: 700, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button 
              disabled={submitting}
              style={{ 
                padding: '10px 24px', 
                borderRadius: '12px', 
                background: '#0f172a', 
                color: '#fff', 
                border: 'none', 
                fontWeight: 700, 
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1
              }}
            >
              <Megaphone size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
              {submitting ? 'Posting...' : 'Post Update'}
            </button>
          </div>
        </form>
      )}

      {updates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <MessageSquare size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <p style={{ fontWeight: 600 }}>No updates posted yet.</p>
          <p style={{ fontSize: '0.85rem' }}>Your backers want to know how the project is going!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {updates.map((update) => (
            <div key={update.id} style={{ padding: '24px', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>{update.title}</h4>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                  <Calendar size={14} /> {new Date(update.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p style={{ color: '#475569', lineHeight: 1.6, marginBottom: '20px', whiteSpace: 'pre-wrap' }}>{update.body}</p>
              {update.mediaUrl && (
                <div style={{ width: '100%', maxHeight: '400px', borderRadius: '16px', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                  <img src={update.mediaUrl} alt="Update" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
