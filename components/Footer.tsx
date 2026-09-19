import Link from 'next/link';
export default function Footer() {
  return <footer className="footer"><div className="container">
    <div className="footerGrid">
      <div><Link className="brand" href="/"><span className="brandMark" aria-hidden="true">H</span>Hepki</Link><p>Everyday help. A little more peace of mind.</p><span>Verified, flexible help when you need it.</span></div>
      <div><strong>Explore Hepki</strong><Link href="/categories">Our services</Link><Link href="/about">About us</Link><Link href="/become-a-buddy">Become a Buddy</Link></div>
      <div><strong>Here to help</strong><Link href="/bookings">My bookings</Link><Link href="/safety">Safety & Trust</Link><Link href="/contact">Contact us</Link></div>
    </div><div className="footerBottom"><span>© 2026 Hepki</span><span>Built for India · Made for everyday life</span></div>
  </div></footer>;
}
