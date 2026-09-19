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
  const [scrolled, setScrolled] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const links = [
    { href: '/categories', label: 'Categories' },
    { href: '/safety', label: 'Safety' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
    { href: '/bookings', label: 'My Bookings' },
  ];

  return (
    <header
      className={`siteHeader ${scrolled ? 'isScrolled' : ''}`}
      onKeyDown={event => {
        if (event.key === 'Escape' && menuOpen) {
          setMenuOpen(false);
          menuButton.current?.focus();
        }
      }}
    >
      <a className="skipLink" href="#main-content">
        Skip to content
      </a>
      <div className="container headerInner">
        <Link href="/" className="brand" aria-label="Hepki Home">
          <span className="brandMark" aria-hidden="true">H</span>
          <span className="brandName">Hepki</span>
        </Link>

        {/* Clean, airy, modern navigation */}
        <nav id="main-navigation" aria-label="Main navigation" className={`nav ${menuOpen ? 'isOpen' : ''}`}>
          <div className="navLinks">
            {links.map(item => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`navLink ${isActive ? 'navLinkActive' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                  {isActive && <span className="navLinkUnderline" aria-hidden="true" />}
                </Link>
              );
            })}
          </div>
          <Link className="mobileBooking" href="/book" onClick={() => setMenuOpen(false)}>
            <span>Book a Buddy</span>
            <span className="mobileBookingArrow">→</span>
          </Link>
        </nav>

        <div className="headerActions">
          {!loading &&
            (user ? (
              <div className="userNavGroup">
                <Link className="userAccountPill" href="/account">
                  Account
                </Link>
                <button
                  className="navLogoutBtn"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setError('');
                    try {
                      await logout();
                    } catch (e) {
                      setError(errorMessage(e));
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {busy ? '...' : 'Log out'}
                </button>
              </div>
            ) : (
              <Link className="loginLink" href="/auth">
                Login
              </Link>
            ))}
          <Link className="headerCtaBtn" href="/book">
            Book a Buddy
          </Link>
          <button
            ref={menuButton}
            type="button"
            className={`menuToggle ${menuOpen ? 'isActive' : ''}`}
            aria-expanded={menuOpen}
            aria-controls="main-navigation"
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            onClick={() => setMenuOpen(open => !open)}
          >
            <span className="hamburgerLine line1" />
            <span className="hamburgerLine line2" />
            <span className="hamburgerLine line3" />
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="notice error headerError">
          {error}
        </p>
      )}
    </header>
  );
}
