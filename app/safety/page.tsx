import Link from 'next/link';

export const metadata = { title: 'Safety & Trust — Hepki' };

export default function Page() {
  return (
    <section className="section pageTop">
      <div className="container">
        <div className="sectionHeading">
          <span className="eyebrow">SAFETY & TRUST</span>
          <h1>Designed for safer bookings.</h1>
          <p>
            Clear verification, live booking status, emergency SOS workflows, and secure payments built into every step of the Hepki experience.
          </p>
        </div>

        <div className="infoGrid">
          <article className="safetyCard">
            <div className="stepTop">
              <span className="stepBadge">Safety 01</span>
              <span className="stepIcon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </span>
            </div>
            <h3>Verified Buddies</h3>
            <p>Every Buddy undergoes government identity checks, background verification, and skill onboarding before accepting bookings on Hepki.</p>
          </article>

          <article className="safetyCard">
            <div className="stepTop">
              <span className="stepBadge">Safety 02</span>
              <span className="stepIcon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </span>
            </div>
            <h3>Live Status</h3>
            <p>Track booking progress from confirmed to en route, arrived, in progress and completed.</p>
          </article>          <article className="safetyCard">
            <div className="stepTop">
              <span className="stepBadge">Safety 03</span>
              <span className="stepIcon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  <circle cx="12" cy="16" r="1" />
                </svg>
              </span>
            </div>
            <h3>Secure OTP Start</h3>
            <p>Tasks begin only after physical arrival and one-time password (OTP) verification shared by the customer.</p>
          </article>

          <article className="safetyCard" id="sos">
            <div className="stepTop">
              <span className="stepBadge">Safety 04</span>
              <span className="stepIcon alertIcon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </span>
            </div>
            <h3>Emergency Assistance (SOS)</h3>
            <p>Direct emergency escalation and immediate support channels available during all active service sessions.</p>
          </article>
        </div>

        <div className="aboutCtaBanner" style={{ marginTop: '48px' }}>
          <div>
            <h3>Questions about safety standards?</h3>
            <p>Our dedicated trust and safety team is available 24/7 to address any inquiries.</p>
          </div>
          <div className="aboutCtaActions">
            <Link className="primaryButton" href="/contact">
              Contact Support <span className="btnArrow">→</span>
            </Link>
            <Link className="secondaryButton" href="/book">
              Book a Buddy
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
