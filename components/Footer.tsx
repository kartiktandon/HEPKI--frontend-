import Link from 'next/link';
export default function Footer() {
  return <footer className="footer"><div className="container footerGrid"><div><strong>Hepki</strong><p>Verified, flexible help when you need it.</p></div><div><Link href="/safety">Safety & Trust</Link><Link href="/become-a-buddy">Become a Buddy</Link><Link href="/contact">Contact</Link></div><div><span>© 2026 Hepki</span><span>Built for India</span></div></div></footer>;
}
