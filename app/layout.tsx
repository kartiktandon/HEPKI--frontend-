import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SessionProvider from '@/components/SessionProvider';
export const metadata: Metadata = { title: { default: 'Hepki', template: '%s | Hepki' }, description: 'Book verified Buddies for flexible on-demand assistance.' };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body><SessionProvider><Header/><main>{children}</main><Footer/></SessionProvider></body></html>; }
