import type { Metadata } from 'next';
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from 'next/font/google';
import { AuthProvider } from '@/providers/auth-provider';
import { QueryProvider } from '@/providers/query-provider';
import { appConfig } from '@/config/app.config';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
  // Chrome flags next/font preloads as unused when CSS vars + utilities resolve late.
  preload: false,
});

const bricolage = Bricolage_Grotesque({
  variable: '--font-bricolage',
  subsets: ['latin'],
  display: 'swap',
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  title: appConfig.name,
  description: appConfig.description,
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon', type: 'image/png', sizes: '32x32' },
    ],
    apple: [{ url: '/apple-icon', sizes: '180x180', type: 'image/png' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`bg-canvas ${inter.variable} ${bricolage.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body
        className={`${inter.className} min-h-screen bg-canvas font-sans text-ink antialiased`}
        suppressHydrationWarning
      >
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
