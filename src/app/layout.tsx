import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "../styles/global.css";
import ClientLayout from "@/components/layout/ClientLayout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pvstoryviewer.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Instagram Story & Followers Viewer (2026) | PvStoryViewer',
    template: '%s | PvStoryViewer',
  },
  description: 'Watch IG stories, followers, posts & reels anonymously. No login, zero trace — the poster never knows. The best Insta PV story viewer for private browsing!',
  authors: [{ name: 'PvStoryViewer Editorial Team', url: SITE_URL }],
  creator: 'PvStoryViewer',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png' }],
    other: [{ rel: 'manifest', url: '/site.webmanifest' }],
  },
  openGraph: {
    title: 'Instagram Story & Followers Viewer (2026) | PvStoryViewer',
    description: 'Watch IG stories, followers, posts & reels anonymously. No login, zero trace — the poster never knows. The best Insta PV story viewer for private browsing!',
    type: 'website',
    url: SITE_URL,
    siteName: 'PvStoryViewer',
    images: [
      {
        url: '/android-chrome-512x512.png',
        width: 512,
        height: 512,
        alt: 'PvStoryViewer — Anonymous Instagram Story Viewer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Instagram Story & Followers Viewer (2026) | PvStoryViewer',
    description: 'Watch IG stories, followers, posts & reels anonymously. No login, zero trace — the poster never knows. The best Insta PV story viewer for private browsing!',
    images: ['/android-chrome-512x512.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Preload mobile hero background image for instant LCP optimization */}
        <link rel="preload" href="/colorful-waves-mobile.webp" as="image" type="image/webp" />

        {/* Canonical Tag for SEO */}
        <link rel="canonical" href="https://pvstoryviewer.com/" />

        {/* Organization Schema for Search Engines */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "PvStoryViewer",
              "url": "https://pvstoryviewer.com",
              "logo": "https://pvstoryviewer.com/favicon.ico",
              "description": "Anonymous Instagram Story and Profile Viewer"
            }),
          }}
        />

        {/* Google AdSense Verification Code */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1602093984257648"
          crossOrigin="anonymous"
        />
        
        {/* Preconnect to Instagram CDN for fast image loading */}
        <link rel="preconnect" href="https://scontent.cdninstagram.com" />
        <link rel="dns-prefetch" href="https://scontent.cdninstagram.com" />
        <link rel="preconnect" href="https://instagram.fkhi3-1.fna.fbcdn.net" />
        <link rel="dns-prefetch" href="https://graph.instagram.com" />
      </head>
      <body suppressHydrationWarning>
        {/* Google Analytics loaded lazily to maximize speed performance */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-M16BTK301X"
          strategy="lazyOnload"
        />
        <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-M16BTK301X');
          `}
        </Script>

        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
