import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/global.css";
import ClientLayout from "@/components/layout/ClientLayout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap", // Prevent invisible text during font load
});

export const metadata: Metadata = {
  title: "InstaPvStory - Anonymous Instagram Story & Profile Viewer",
  description: "View Instagram stories, posts, followers and highlights anonymously. No login required.",
  keywords: ["instagram viewer", "anonymous instagram", "instagram story viewer", "instagram profile viewer"],
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png" },
    ],
    other: [
      { rel: "manifest", url: "/site.webmanifest" },
    ],
  },
  openGraph: {
    title: "InstaPvStory - Anonymous Instagram Story & Profile Viewer",
    description: "View Instagram stories, posts, followers and highlights anonymously. No login required.",
    type: "website",
    images: [{ url: "/android-chrome-512x512.png" }],
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
        />
      </head>
      <body suppressHydrationWarning>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
