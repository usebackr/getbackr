import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Backr — Get seen. Get backed.',
  description:
    'Backr is a creator-first crowdfunding platform for musicians, filmmakers, artists, and community creators.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
