// pages/_document.tsx
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* ── Character encoding & viewport ── */}
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* ── Favicon ── */}
        <link rel="icon" href="/favicon.ico" />

        {/* ── Brand / SEO meta ── */}
        <meta name="application-name" content="DashBets" />
        <meta name="theme-color" content="#111827" />

        {/* ── Google Fonts preconnect ── */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* ── Fonts ── */}
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&family=Syne:wght@600;700;800&family=Exo+2:wght@400;500;600;700;800&family=Rajdhani:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <body
        className="bg-gray-900 text-white antialiased"
        style={{ backgroundColor: '#111827' }}
      >
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}