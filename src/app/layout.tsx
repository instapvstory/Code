import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "../styles/global.css";
import ClientLayout from "@/components/layout/ClientLayout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "optional", // Use cached font only — avoids text-swap CLS on mobile
  preload: true,
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pvstoryviewer.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'PvStoryViewer — Anonymous Instagram Story & Profile Viewer',
    template: '%s | PvStoryViewer',
  },
  description: 'View Instagram stories, posts, reels, highlights and profile data anonymously. No login required. Works on Business and Creator accounts.',
  keywords: ['instagram viewer', 'anonymous instagram', 'instagram story viewer', 'instagram profile viewer', 'view instagram stories without account', 'instagram anonymous viewer'],
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
    title: 'PvStoryViewer — Anonymous Instagram Story & Profile Viewer',
    description: 'View Instagram stories, posts, reels and highlights anonymously. No login required.',
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
    title: 'PvStoryViewer — Anonymous Instagram Story & Profile Viewer',
    description: 'View Instagram stories, posts, reels and highlights anonymously. No login required.',
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
        {/* Google AdSense Verification */}
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
        {/* Preload hero background WebP so it loads before paint */}
        <link
          rel="preload"
          as="image"
          href="/colorful-waves.webp"
          type="image/webp"
          // @ts-ignore
          fetchPriority="high"
        />
      </head>
      <body suppressHydrationWarning>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-M16BTK301X"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
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
