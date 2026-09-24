'use client';
import Link from 'next/link';
import { useSession } from './SessionProvider';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { errorMessage } from '@/lib/api/client';
import HepkiLogo from './HepkiLogo';

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
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const isOver = window.scrollY > 10;
          setScrolled(prev => (prev !== isOver ? isOver : prev));
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const links = pathname === '/' ? [
    { href: '/#services', label: 'Services' },
    { href: '/#how-it-works', label: 'How It Works' },
    { href: '/#pricing', label: 'Pricing' },
    { href: '/#become-a-buddy', label: 'Become a Buddy' },
    { href: '/#faqs', label: 'FAQs' },
  ] : [
    { href: '/', label: 'Home' },
    { href: '/categories', label: 'Services' },
    { href: '/safety', label: 'Safety' },
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
          <HepkiLogo size="default" />
        </Link>

        {/* Clean, airy, modern navigation */}
        <nav id="main-navigation" aria-label="Main navigation" className={`nav ${menuOpen ? 'isOpen' : ''}`}>
          <div className="navLinks">
            {links.map(item => {
              const route = item.href.split('#')[0] || '/';
              const isActive = item.href === '/' ? pathname === '/' : !item.href.includes('#') && (pathname === route || pathname.startsWith(`${route}/`));
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
        </nav>

        <div className="headerActions">
          {!loading && user ? (
            <div className="userNavGroup">
              <Link className="headerBookBtn" href="/book">
                Book a Buddy <span className="btnArrow">→</span>
              </Link>
              <Link className="userAccountPill" href="/account">
                <span className="userDot"></span>
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
            <div className="authNavGroup">
              <Link className="headerBookBtn" href="/book">
                Book a Buddy <span className="btnArrow">→</span>
              </Link>
              <Link className="headerLoginBtn" href="/auth">
                Login
              </Link>
            </div>
          )}

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


