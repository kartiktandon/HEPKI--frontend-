'use client';
import Link from 'next/link';
import { useSession } from './SessionProvider';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { errorMessage } from '@/lib/api/client';

export default function Header() {
  const { user, loading, logout } = useSession();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  useEffect(() => { setMenuOpen(false); }, [pathname]);
  const links = [['/categories', 'Categories'], ['/safety', 'Safety'], ['/about', 'About'], ['/contact', 'Contact'], ['/bookings', 'My Bookings']];
  return (
    <header className="siteHeader" onKeyDown={event => { if (event.key === 'Escape' && menuOpen) { setMenuOpen(false); menuButton.current?.focus(); } }}>
      <a className="skipLink" href="#main-content">Skip to content</a>
      <div className="container headerInner">
        <Link href="/" className="brand">
          <span className="brandMark" aria-hidden="true">H</span>
          <span>Hepki</span>
        </Link>
        <nav id="main-navigation" aria-label="Main navigation" className={`nav ${menuOpen ? 'isOpen' : ''}`}>
          {links.map(([href, title]) => <Link key={href} href={href} aria-current={pathname === href || pathname.startsWith(`${href}/`) ? 'page' : undefined} onClick={() => setMenuOpen(false)}>{title}</Link>)}
          <Link className="mobileBooking" href="/book" onClick={() => setMenuOpen(false)}>Book a Buddy →</Link>
        </nav>
        <div className="headerActions">
          {!loading && (user ? <><Link className="linkButton" href="/account">Account</Link><button className="textLink" disabled={busy} onClick={async () => { setBusy(true); setError(''); try { await logout(); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); } }}>Log out</button></> : <Link className="linkButton" href="/auth">Login</Link>)}
          <Link className="primaryButton small" href="/book">Book a Buddy</Link>
          <button ref={menuButton} type="button" className="menuToggle" aria-expanded={menuOpen} aria-controls="main-navigation" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} onClick={() => setMenuOpen(open => !open)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d={menuOpen ? 'M6 6l12 12M18 6L6 18' : 'M4 6h16M4 12h16M4 18h16'}/></svg>
          </button>
        </div>
      </div>
    {error && <p role="alert" className="notice error">{error}</p>}</header>
  );
}
