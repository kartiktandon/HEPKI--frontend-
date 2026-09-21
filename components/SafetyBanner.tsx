export default function SafetyBanner() {
  return (
    <section className="section safetyBannerSection">
      <div className="container">
        <div className="safetyBannerBox">
          <div className="safetyBannerHeading">
            <h3>Your safety<br />is our priority.</h3>
            <p>Verified Buddies. Secure payments. Real-time support.</p>
          </div>

          <div className="safetyBannerFeatures">
            <div className="safetyFeatureItem">
              <div className="safetyIconWrap" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <div className="safetyFeatureText">
                <strong>Verified Profiles</strong>
                <span>All Buddies are background verified and identity checked.</span>
              </div>
            </div>

            <div className="safetyFeatureItem">
              <div className="safetyIconWrap" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              </div>
              <div className="safetyFeatureText">
                <strong>Secure Payments</strong>
                <span>Pay safely through Razorpay with multiple options.</span>
              </div>
            </div>

            <div className="safetyFeatureItem">
              <div className="safetyIconWrap" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className="safetyFeatureText">
                <strong>Live Booking Status</strong>
                <span>Track your Buddy in real-time from booking to completion.</span>
              </div>
            </div>

            <div className="safetyFeatureItem">
              <div className="safetyIconWrap" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                  <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                </svg>
              </div>
              <div className="safetyFeatureText">
                <strong>24/7 Support</strong>
                <span>Our team is always here to help, anytime.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
