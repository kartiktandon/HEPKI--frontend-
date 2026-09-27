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
            <Image className="appStoreBadge appStoreBadgeApple" src="/assets/store-badges/app-store.svg" alt="Download on the App Store" width={120} height={40} />
            <Image className="appStoreBadge appStoreBadgeGoogle" src="/assets/store-badges/google-play.png" alt="Get it on Google Play" width={646} height={250} />
            <span className="appBannerComingSoon"><span aria-hidden="true" />Coming soon</span>
          </div>
        </div>
      </div>
    </section>
  );
}
