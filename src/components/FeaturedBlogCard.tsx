'use client';

import Image from 'next/image';
import { BlogPost } from '@/data/blog-posts';

export default function FeaturedBlogCard({ post }: { post: BlogPost }) {
  return (
    <a 
      href={`/blog/${post.slug}`}
      className="featured-post-link"
      style={{ 
        textDecoration: 'none',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        background: '#ffffff',
        borderRadius: '32px',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div style={{ height: '400px', position: 'relative', overflow: 'hidden' }}>
        <Image 
          src={post.image} 
          alt={post.title}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          style={{ objectFit: 'cover' }}
          quality={85}
        />
      </div>
      <div style={{ padding: 'clamp(32px, 6vw, 64px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <span style={{ 
          width: 'fit-content',
          padding: '6px 16px',
          borderRadius: '12px',
          background: 'rgba(16, 185, 129, 0.1)',
          color: 'var(--accent-primary)',
          fontWeight: 800,
          fontSize: '0.8rem',
          textTransform: 'uppercase',
          marginBottom: '24px'
        }}>
           Featured Article
        </span>
        <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: 'var(--accent-secondary)', marginBottom: '20px', lineHeight: 1.1 }}>
          {post.title}
        </h2>
        <p style={{ fontSize: '1.1rem', color: '#445569', lineHeight: 1.6, marginBottom: '32px' }}>
          {post.excerpt}
        </p>
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 800, color: 'var(--accent-primary)' }}>
          Read More
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      <style jsx>{`
        .featured-post-link:hover {
          transform: translateY(-8px);
          border-color: var(--accent-primary);
          box-shadow: 0 40px 100px rgba(16, 185, 129, 0.1);
        }
      `}</style>
    </a>
  );
}
