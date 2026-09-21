import Image from 'next/image';
import Link from 'next/link';

export default function LandingHero() {
  return (
    <section className="hero">
      <div className="container heroGrid">
        <div className="heroCopy">
          <div className="heroBadgeRow">
            <span className="heroPillTag">Help, when you need it</span>
          </div>

          <h1 className="heroTitle">
            Your trusted Buddy
            <br />
            for everyday help.
          </h1>
          <p className="heroSubtitle">
            Book verified Buddies for household support, errands
            <br className="hideMobile" />
            and everyday assistance — now, later, or every month.
          </p>

          <div className="heroCtaRow">
            <Link className="heroBookBtn" href="/book">
              Book Now <span className="btnArrow">→</span>
            </Link>
          </div>

          <div className="heroTrustRow">
            <div className="heroTrustItem">
              <span className="heroTrustIcon" aria-hidden="true">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </span>
              <div className="heroTrustText">
                <span>Verified Buddy</span>
                <span>profiles</span>
              </div>
            </div>

            <div className="heroTrustItem">
              <span className="heroTrustIcon" aria-hidden="true">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              </span>
              <div className="heroTrustText">
                <span>Secure</span>
                <span>payments</span>
              </div>
            </div>

            <div className="heroTrustItem">
              <span className="heroTrustIcon" aria-hidden="true">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                  <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                </svg>
              </span>
              <div className="heroTrustText">
                <span>Live</span>
                <span>support</span>
              </div>
            </div>
          </div>
        </div>

        <div className="heroVisual">
          <Image
            src="/assets/welcome-hero.png"
            alt="Hepki Buddy assisting a customer"
            width={880}
            height={520}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 58vw, 880px"
            priority
          />
        </div>
      </div>
    </section>
  );
}

