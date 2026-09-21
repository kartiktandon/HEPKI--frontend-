import Image from 'next/image';

export default function AppBanner() {
  return (
    <section className="section appBannerSection">
      <div className="container">
        <div className="appBannerBox">
          <div className="appBannerPhone">
            <div className="phoneMockup">
              <div className="phoneScreen">
                <div className="phoneAppLogo">
                  <Image
                    src="/assets/hepki-logo.png"
                    alt="Hepki App"
                    width={32}
                    height={32}
                    style={{ borderRadius: 8, display: 'block', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}
                  />
                  <span>Hepki</span>
                </div>
              </div>
            </div>
          </div>

          <div className="appBannerContent">
            <h3>Get the Hepki app</h3>
            <p>Book help, manage your services and track your Buddies — all from your phone.</p>
          </div>

          <div className="appBannerButtons">
            <a href="#download" className="appStoreBadgeBtn" aria-label="Get it on Google Play">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a2.41 2.41 0 0 1-.61-1.636V3.45c0-.623.232-1.2.609-1.636zm11.233 11.233l2.42 2.42-12.023 6.953 9.603-9.373zm2.42-2.094l2.871 1.657a1.44 1.44 0 0 1 0 2.48l-2.871 1.657-2.127-2.127 2.127-2.667zM5.239 2.58l12.023 6.953-2.42 2.42-9.603-9.373z" />
              </svg>
              <div className="appStoreBadgeText">
                <span className="appStoreSmall">GET IT ON</span>
                <span className="appStoreLarge">Google Play</span>
              </div>
            </a>

            <a href="#download" className="appStoreBadgeBtn" aria-label="Download on the App Store">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.87-.9.04-1.97.6-2.6 1.34-.56.64-.99 1.68-.86 2.7 1 .08 2-.45 2.54-1.17z" />
              </svg>
              <div className="appStoreBadgeText">
                <span className="appStoreSmall">Download on the</span>
                <span className="appStoreLarge">App Store</span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
