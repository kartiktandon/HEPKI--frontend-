import Link from 'next/link';
import HepkiLogo from './HepkiLogo';

const groups = [
  { title: 'Explore', links: [['What We Offer', '/categories'], ['How It Works', '/#how-it-works'], ['Safety & Trust', '/safety'], ['Pricing', '/#pricing']] },
  { title: 'Resources', links: [['FAQs', '/#faqs'], ['My Bookings', '/bookings'], ['Account', '/account'], ['Contact', '/contact']] },
  { title: 'Company', links: [['Home', '/'], ['About Us', '/about'], ['Become a Buddy', '/become-a-buddy'], ['Services', '/services']] },
];

export default function Footer() {
  return (
    <footer className="hpFooter">
      <div className="hpContainer hpFooterGrid">
        <div className="hpFooterBrand">
          <Link href="/" aria-label="Hepki home"><HepkiLogo size="large" light /></Link>
          <p>Trusted companions for everyday tasks — care, support and peace of mind, when you need it.</p>
          <Link href="/book" className="hpFooterBook">Book assistance <span aria-hidden="true">→</span></Link>
        </div>
        <div className="hpFooterLinks">
          {groups.map(group => <div key={group.title}><h2>{group.title}</h2>{group.links.map(([label, href]) => <Link href={href} key={label}>{label}</Link>)}</div>)}
        </div>
      </div>
      <div className="hpContainer hpFooterBottom"><span>© {new Date().getFullYear()} Hepki Technologies. All rights reserved.</span><div><Link href="/contact">Privacy & support</Link><a href="#main-content">Back to top ↑</a></div></div>
    </footer>
  );
}