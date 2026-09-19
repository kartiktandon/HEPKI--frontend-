'use client';
import Link from 'next/link';
export function ErrorNotice({ message, retry }: { message: string; retry?: () => void }) {
  return message ? <div className="notice error" role="alert">{message}{retry && <button type="button" className="textLink" onClick={retry}>Try again</button>}</div> : null;
}
export function LoginNotice({ next = '/bookings' }: { next?: string }) {
  return <div className="emptyState"><h2>Log in to continue</h2><p>Use your Hepki account to access this page.</p><Link className="primaryButton" href={`/auth?next=${encodeURIComponent(next)}`}>Log in</Link></div>;
}
