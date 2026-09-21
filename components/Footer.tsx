import Link from 'next/link';
import HepkiLogo from './HepkiLogo';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        {/* Main Footer Multi-Column Grid */}
        <div className="footerMainGrid">
          {/* Brand & Mission Column */}
          <div className="footerColBrand">
            <Link href="/" className="footerBrand" aria-label="Hepki Home">
              <HepkiLogo size="default" />
            </Link>
            <p className="footerTagline">
              On-demand verified buddies for medical visits, shopping support, fitness partners, and everyday help.
            </p>
            <div className="footerTrustPill">
              <span className="footerTrustDot"></span>
              <span>100% Background-Checked Buddies</span>
            </div>
            <div className="footerContactQuick">
              <span className="footerContactLabel">Customer Support</span>
              <a href="mailto:support@hepki.com" className="footerContactEmail">support@hepki.com</a>
            </div>
          </div>

          {/* Categories Column */}
          <div className="footerCol">
            <h4 className="footerColHeading">Categories</h4>
            <ul className="footerLinkList">
              <li><Link href="/book?category=hospital">Hospital Companion</Link></li>
              <li><Link href="/book?category=shopping">Shopping Assistant</Link></li>
              <li><Link href="/book?category=fitness">Fitness & Gym Partner</Link></li>
              <li><Link href="/book?category=errands">Daily Errands</Link></li>
              <li><Link href="/categories">View All Categories</Link></li>
            </ul>
          </div>

          {/* Company Column */}
          <div className="footerCol">
            <h4 className="footerColHeading">Company</h4>
            <ul className="footerLinkList">
              <li><Link href="/about">About Hepki</Link></li>
              <li><Link href="/safety">Safety & Trust</Link></li>
              <li><Link href="/become-a-buddy">Become a Buddy</Link></li>
              <li><Link href="/contact">Contact Support</Link></li>
              <li><Link href="/bookings">My Bookings</Link></li>
            </ul>
          </div>

          {/* Trust & Safety Column */}
          <div className="footerCol">
            <h4 className="footerColHeading">Trust & Safety</h4>
            <ul className="footerLinkList">
              <li><Link href="/safety">Identity Verification</Link></li>
              <li><Link href="/safety">Emergency SOS & Tracking</Link></li>
              <li><Link href="/safety">Secure Razorpay Checkout</Link></li>
              <li><Link href="/about">Community Guidelines</Link></li>
              <li><Link href="/contact">Help & FAQ</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footerBottomRow">
          <div className="footerBottomLeft">
            <span className="footerCopyright">© 2025 Hepki Technologies. All rights reserved.</span>
            <span className="footerDivider">•</span>
            <span className="footerRegionText">Built with care for safe assistance</span>
          </div>

          <div className="footerSocialIcons">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="footerSocialLink" aria-label="Instagram">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="footerSocialLink" aria-label="YouTube">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
              </svg>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="footerSocialLink" aria-label="X (Twitter)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="footerSocialLink" aria-label="LinkedIn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect x="2" y="9" width="4" height="12" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
