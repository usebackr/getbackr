import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://findbackr.com.ng'),
  title: 'Backr — Get seen. Get backed.',
  description:
    'Backr is a creator-first crowdfunding platform for musicians, filmmakers, artists, and community creators.',
  openGraph: {
    title: 'Backr — Get seen. Get backed.',
    description: 'Empowering African Creators to fund their dreams.',
    url: 'https://findbackr.com.ng',
    siteName: 'Backr',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Backr - Empowering African Creators',
      },
    ],
    locale: 'en_NG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Backr — Get seen. Get backed.',
    description: 'Empowering African Creators to fund their dreams.',
    images: ['/opengraph-image.png'],
  },
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body>{children}</body>
    </html>
  );
}
