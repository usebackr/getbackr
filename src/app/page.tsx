import React from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import TransparencySection from '@/components/TransparencySection';
import OngoingProjects from '@/components/OngoingProjects';
import Testimonials from '@/components/Testimonials';
import FAQSection from '@/components/FAQSection';
import Footer from '@/components/Footer';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ flex: 1 }}>
        <Hero />
        <TransparencySection />
        <OngoingProjects />
        <Testimonials />
        <FAQSection />
      </div>
      <Footer />
    </main>
  );
}
