import React from 'react';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BlogCard from '@/components/BlogCard';
import { blogPosts } from '@/data/blog-posts';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = blogPosts.find((p) => p.slug === params.slug);
  if (!post) return { title: 'Post Not Found' };

  return {
    title: `${post.title} | Backr Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.image],
    },
  };
}

export default function BlogPostPage({ params }: Props) {
  const post = blogPosts.find((p) => p.slug === params.slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = blogPosts
    .filter((p) => p.slug !== post.slug)
    .slice(0, 3);

  const renderMarkdownText = (text: string) => {
    // Basic bold support: **text** -> <strong>text</strong>
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={part + i} style={{ fontWeight: 900, color: 'var(--accent-secondary)' }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh' }}>
      <Navbar />

      <article style={{ paddingTop: 'clamp(80px, 12vw, 140px)', overflowX: 'hidden' }}>
        {/* Header Section */}
        <header 
          className="container" 
          style={{ 
            maxWidth: '800px', 
            margin: '0 auto', 
            marginBottom: '60px',
            padding: '0 24px' 
          }}
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            marginBottom: '24px',
            color: 'var(--accent-primary)',
            fontWeight: 800,
            fontSize: '0.9rem',
            textTransform: 'uppercase'
          }}>
            <a href="/blog" style={{ color: 'inherit', textDecoration: 'none' }}>Blog</a>
            <span style={{ color: '#cbd5e1' }}>/</span>
            <span>{post.category}</span>
          </div>

          <h1 style={{ 
            fontSize: 'clamp(2.2rem, 6vw, 4rem)', 
            fontWeight: 1000, 
            lineHeight: 1.1, 
            color: 'var(--accent-secondary)',
            marginBottom: '32px',
            letterSpacing: '-0.02em'
          }}>
            {post.title}
          </h1>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px',
            borderTop: '1px solid #f1f5f9',
            paddingTop: '32px'
          }}>
             <div style={{ 
               width: '48px', 
               height: '48px', 
               borderRadius: '24px', 
               background: 'var(--accent-primary)',
               color: '#fff',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               fontWeight: 800,
               fontSize: '1.2rem'
             }}>
               {post.author.charAt(0)}
             </div>
             <div>
               <p style={{ fontWeight: 800, color: 'var(--accent-secondary)', fontSize: '1rem' }}>{post.author}</p>
               <p style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>{post.date} · {post.readTime}</p>
             </div>
          </div>
        </header>

        {/* Hero Image */}
        <div 
          className="container" 
          style={{ 
            maxWidth: '1000px', 
            margin: '0 auto', 
            marginBottom: '80px',
            padding: '0 24px' 
          }}
        >
          <div style={{ 
            height: 'clamp(280px, 50vh, 550px)',
            width: '100%',
            borderRadius: '32px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 40px 100px rgba(0,0,0,0.1)'
          }}>
            <Image 
              src={post.image} 
              alt={post.title}
              fill
              priority
              sizes="(max-width: 1000px) 100vw, 1000px"
              style={{ objectFit: 'cover' }}
              quality={90}
            />
          </div>
        </div>

        {/* Content Section */}
        <div 
          className="container" 
          style={{ 
            maxWidth: '800px', 
            margin: '0 auto', 
            marginBottom: '120px',
            padding: '0 24px' 
          }}
        >
          <div className="blog-body" style={{ 
            fontSize: 'clamp(1.1rem, 4vw, 1.25rem)', 
            lineHeight: 1.8, 
            color: '#334155',
            fontWeight: 500
          }}>
            {post.content.split('\n').map((line, i) => {
              if (line.startsWith('# ')) {
                return null; // Skip redundant H1
              }
              if (line.startsWith('## ')) {
                return <h2 key={i} style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-secondary)', marginTop: '48px', marginBottom: '24px' }}>{line.replace('## ', '')}</h2>;
              }
              if (line.startsWith('- ')) {
                 return <li key={i} style={{ marginBottom: '12px', paddingLeft: '8px' }}>{renderMarkdownText(line.replace('- ', ''))}</li>;
              }
              if (line.trim() === '') return <br key={i} />;
              return <p key={i} style={{ marginBottom: '24px' }}>{renderMarkdownText(line)}</p>;
            })}
          </div>
        </div>

        {/* Related Posts */}
        <section style={{ background: '#f8fafc', padding: '100px 24px' }}>
          <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent-secondary)', marginBottom: '48px' }}>
              More from the <span className="text-gradient">Journal</span>
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '32px' }}>
              {relatedPosts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </section>
      </article>

      <Footer />
    </div>
  );
}
