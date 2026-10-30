import type { Metadata, Viewport } from 'next';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import InstallPrompt from '@/components/InstallPrompt';
import { APP_NAME } from '@/lib/config';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: `${APP_NAME} — No filter. Just honesty | Zero identity. 100% truth`,
    template: `%s | ${APP_NAME}`,
  },
  description: 'KAHO: No filter. Just honesty. Zero identity. 100% truth. Get your anonymous Q&A link for Instagram & Snapchat stories.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: APP_NAME,
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#EC1187',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased text-white selection:bg-[#EC1187] selection:text-white">
        <Header />
        <main className="mx-auto w-full max-w-5xl px-3 sm:px-4">{children}</main>
        <Footer />
        <InstallPrompt />
      </body>
    </html>
  );
}
