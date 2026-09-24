import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getInitialSession } from '@/lib/api/server';
import SessionProvider from '@/components/SessionProvider';
export const metadata: Metadata = {
  title: { default: 'Hepki — Trusted help for everyday life', template: '%s | Hepki' },
  description: 'Hepki connects you with verified Buddies for hospital visits, shopping, fitness and everyday assistance.',
  icons: {
    icon: '/assets/hepki-logo.png',
    apple: '/assets/hepki-logo.png',
  },
};
export default async function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { const initialSession = await getInitialSession(); return <html lang="en"><body><SessionProvider initialSession={initialSession}><Header/><main id="main-content" tabIndex={-1}>{children}</main><Footer/></SessionProvider></body></html>; }
