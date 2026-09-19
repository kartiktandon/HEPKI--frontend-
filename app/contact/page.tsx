import Link from 'next/link';
import { serverGet } from '@/lib/api/server';
import { record, text, unwrap } from '@/lib/api/models';

export const metadata = { title: 'Contact Us | Hepki' };

export default async function ContactPage() {
  let payload: unknown;
  try {
    payload = await serverGet('/api/v1/public/content/contact');
  } catch {
    payload = null;
  }
  const contact = payload ? record(record(unwrap(payload)).contact) : {};
  const email = text(contact.email, 'support@hepki.in');
  const phone = text(contact.phone, '+91 98765 43210');
  const address = text(contact.address, 'Hepki Support Hub, 4th Block, Koramangala, Bangalore, Karnataka, India');

  return (
    <section className="section pageTop contactPageSection">
      <div className="container">
        {/* Top Header */}
        <div className="contactHeader">
          <div className="contactBadgeRow">
            <span className="pulseBadge">
              <span className="pulseDot" />
              Support Team Online
            </span>
            <span className="channelBadge">Avg response: &lt; 15 mins</span>
          </div>
          <h1>We&apos;re here to help you anytime.</h1>
          <p>
            Have a question about a booking, need help finding a verified Buddy, or have an issue with your account? Reach out to our dedicated support team directly.
          </p>
        </div>

        {/* Support Grid: Left is Cards, Right is Quick Help & Booking Hub */}
        <div className="contactModernGrid">
          {/* Main Channels Column */}
          <div className="contactChannelsCol">
            <h2>Direct Channels</h2>
            <div className="contactChannelList">
              {/* Email Support */}
              <a href={`mailto:${encodeURIComponent(email)}`} className="modernChannelCard">
                <div className="channelIconBox emailBox">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="2" y="4" width="20" height="16" rx="3" />
                    <path d="M22 7l-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <div className="channelInfo">
                  <div className="channelInfoHeader">
                    <strong>Email Support</strong>
                    <span className="channelPill">Fastest for tickets</span>
                  </div>
                  <span className="channelValue">{email}</span>
                  <p className="channelDesc">Send us inquiries, receipts, or detailed feedback anytime.</p>
                </div>
                <div className="channelActionArrow" aria-hidden="true">→</div>
              </a>

              {/* Phone & WhatsApp */}
              <a href={`tel:${phone.replace(/[^+0-9]/g, '')}`} className="modernChannelCard">
                <div className="channelIconBox phoneBox">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <div className="channelInfo">
                  <div className="channelInfoHeader">
                    <strong>Phone & WhatsApp Hotline</strong>
                    <span className="channelPill greenPill">9 AM – 9 PM</span>
                  </div>
                  <span className="channelValue">{phone}</span>
                  <p className="channelDesc">Direct telephone assistance & WhatsApp help for quick queries.</p>
                </div>
                <div className="channelActionArrow" aria-hidden="true">→</div>
              </a>

              {/* Office & Operations Hub */}
              <div className="modernChannelCard staticCard">
                <div className="channelIconBox locationBox">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div className="channelInfo">
                  <div className="channelInfoHeader">
                    <strong>Support & Operations Hub</strong>
                    <span className="channelPill purplePill">Headquarters</span>
                  </div>
                  <span className="channelValue">{address}</span>
                  <p className="channelDesc">Physical verification center and regional partner desk.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Fast Resolution & Action Panels */}
          <div className="contactSideCol">
            {/* Active Booking Priority Support */}
            <div className="activeBookingSupportCard">
              <div className="supportCardBadge">
                <span className="pulseDot" />
                Priority Resolution
              </div>
              <h3>Have an active booking right now?</h3>
              <p>
                For immediate task-related questions, OTP confirmation issues, or emergency rescheduling, manage it straight from your booking console.
              </p>
              <div className="supportCardActions">
                <Link className="primaryButton full" href="/bookings">
                  Go to My Bookings <span className="btnArrow">→</span>
                </Link>
                <Link className="secondaryButton full" href="/safety">
                  Review Safety & SOS Rules
                </Link>
              </div>
            </div>

            {/* Support Guarantees */}
            <div className="contactGuarantees">
              <div className="guaranteeItem">
                <span className="guaranteeIcon">🛡️</span>
                <div>
                  <strong>100% Verified Identity</strong>
                  <span>Every Buddy is background-checked before onboarding.</span>
                </div>
              </div>
              <div className="guaranteeItem">
                <span className="guaranteeIcon">💳</span>
                <div>
                  <strong>Protected Transactions</strong>
                  <span>Encrypted Razorpay payments keep your transactions safe and verified.</span>
                </div>
              </div>
              <div className="guaranteeItem">
                <span className="guaranteeIcon">⚡</span>
                <div>
                  <strong>Zero-Wait SOS Assistance</strong>
                  <span>Emergency contact buttons active during all ongoing sessions.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick FAQ / Help strip */}
        <div className="contactFaqBanner">
          <div className="faqBannerContent">
            <h3>Looking to partner or earn as a Buddy?</h3>
            <p>Join hundreds of verified Buddies earning flexible income on their own schedules with complete safety.</p>
          </div>
          <Link href="/become-a-buddy" className="primaryButton">
            Become a Buddy <span className="btnArrow">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
