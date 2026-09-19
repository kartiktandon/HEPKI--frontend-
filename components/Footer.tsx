import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        {/* Main Footer Content */}
        <div className="footerGrid">
          <div className="footerBrandCol">
            <Link className="brand footerBrand" href="/">
              <span className="brandMark" aria-hidden="true">H</span>
              Hepki
            </Link>
            <p className="footerTagline">
              Your trusted platform for everyday assistance, household support, and verified companionship across Indian cities.
            </p>
            <div className="footerPillBadge">
              <span className="footerPulseDot"></span> Live across Indian Cities
            </div>
          </div>

          <div className="footerNavCol">
            <strong>Explore Hepki</strong>
            <Link href="/categories">All Categories</Link>
            <Link href="/book">Book a Buddy</Link>
            <Link href="/book?type=prebooked">Pre-Book Service</Link>
            <Link href="/book?type=monthly_session">Monthly Package</Link>
          </div>

          <div className="footerNavCol">
            <strong>Trust & Safety</strong>
            <Link href="/about">About Hepki</Link>
            <Link href="/safety">Safety Standards</Link>
            <Link href="/become-a-buddy">Become a Buddy</Link>
            <Link href="/contact">Help & Contact</Link>
          </div>

          <div className="footerNavCol">
            <strong>Customer Portal</strong>
            <Link href="/bookings">My Bookings</Link>
            <Link href="/account">Account Settings</Link>
            <Link href="/auth">Sign In / Register</Link>
            <Link href="/safety">Emergency Guidelines</Link>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="footerBottom">
          <div className="footerBottomCopy">
            <span>© 2026 Hepki Technologies Pvt Ltd. All rights reserved.</span>
            <span className="footerDotDivider">•</span>
            <span>Built with ❤️ for everyday life</span>
          </div>
          <div className="footerLegalLinks">
            <Link href="/safety">Privacy Policy</Link>
            <Link href="/safety">Terms of Service</Link>
            <Link href="/contact">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
