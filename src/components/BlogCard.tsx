'use client';

import Image from 'next/image';
import { BlogPost } from '@/data/blog-posts';

export default function BlogCard({ post }: { post: BlogPost }) {
  return (
    <a
      href={`/blog/${post.slug}`}
      className="blog-card"
      style={{
        textDecoration: 'none',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '24px',
        overflow: 'hidden',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        height: '100%',
      }}
    >
      <div
        style={{
          height: '240px',
          width: '100%',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Image 
          src={post.image} 
          alt={post.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          style={{ objectFit: 'cover' }}
          quality={85}
        />
        <span
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            padding: '6px 12px',
            borderRadius: '10px',
            fontSize: '0.75rem',
            fontWeight: 800,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(4px)',
            color: 'var(--accent-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            zIndex: 10
          }}
        >
          {post.category}
        </span>
      </div>

      <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
            color: '#64748b',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          <span>{post.date}</span>
          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#cbd5e1' }} />
          <span>{post.readTime}</span>
        </div>

        <h3
          style={{
            fontSize: '1.4rem',
            fontWeight: 800,
            color: 'var(--accent-secondary)',
            marginBottom: '12px',
            lineHeight: 1.3,
            transition: 'color 0.2s',
          }}
          className="blog-title-h3"
        >
          {post.title}
        </h3>

        <p
          style={{
            color: '#475569',
            fontSize: '1rem',
            lineHeight: 1.6,
            marginBottom: '20px',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {post.excerpt}
        </p>

        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--accent-primary)',
            fontWeight: 800,
            fontSize: '0.9rem',
          }}
        >
          Read Article
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      <style jsx>{`
        .blog-card:hover {
          transform: translateY(-8px);
          border-color: var(--accent-primary);
          box-shadow: 0 30px 60px rgba(16, 185, 129, 0.1);
        }
        .blog-card:hover .blog-title-h3 {
          color: var(--accent-primary);
        }
      `}</style>
    </a>
  );
}
