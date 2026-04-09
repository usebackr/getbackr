import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BlogCard from '@/components/BlogCard';
import FeaturedBlogCard from '@/components/FeaturedBlogCard';
import { blogPosts } from '@/data/blog-posts';

export const metadata = {
  title: 'Blog | Backr - Insights for African Creators',
  description: 'Pro tips, success stories, and accountability guides for the next generation of African creative entrepreneurs.',
};

export default function BlogListPage() {
  const featuredPost = blogPosts[0];
  const regularPosts = blogPosts.slice(1);

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <Navbar />
      
      <main style={{ padding: 'clamp(60px, 10vw, 120px) 24px' }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <header style={{ marginBottom: '80px', textAlign: 'center' }}>
            <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900, color: 'var(--accent-secondary)', marginBottom: '24px' }}>
              The <span className="text-gradient">Creator</span> Journal
            </h1>
            <p style={{ fontSize: '1.2rem', color: '#475569', maxWidth: '600px', margin: '0 auto', fontWeight: 500 }}>
              Insights, strategies, and stories from the frontlines of African crowdfunding.
            </p>
          </header>

          {/* Featured Post */}
          <section style={{ marginBottom: '100px' }}>
            <FeaturedBlogCard post={featuredPost} />
          </section>

          {/* Grid View */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '32px' }}>
            {regularPosts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
