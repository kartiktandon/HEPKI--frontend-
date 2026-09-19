'use client';
import Link from 'next/link';
import { useSession } from './SessionProvider';
import { useState } from 'react';
import { errorMessage } from '@/lib/api/client';

export default function Header() {
  const { user, loading, logout } = useSession();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <header className="siteHeader">
      <div className="container headerInner">
        <Link href="/" className="brand">
          <span className="brandMark" aria-hidden="true">H</span>
          <span>Hepki</span>
        </Link>
        <nav className="nav">
          <Link href="/categories">Categories</Link>
          <Link href="/safety">Safety</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/bookings">My Bookings</Link>
        </nav>
        <div className="headerActions">
          {!loading && (user ? <><Link className="linkButton" href="/account">Account</Link><button className="textLink" disabled={busy} onClick={async () => { setBusy(true); setError(''); try { await logout(); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); } }}>Log out</button></> : <Link className="linkButton" href="/auth">Login</Link>)}
          <Link className="primaryButton small" href="/book">Book a Buddy</Link>
        </div>
      </div>
    {error && <p role="alert" className="notice error">{error}</p>}</header>
  );
}
