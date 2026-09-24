import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import ScrollAnimations from '@/components/ScrollAnimations';
import TopCategories from '@/components/TopCategories';

const services = [
  { number: '01/03', title: 'Hospital Accompaniment', description: 'A Buddy by your side for appointments, procedures and hospital visits — someone dependable when it matters most.', image: '/assets/hepki-home/hospital.jpg', alt: 'A companion supporting a patient during a hospital visit' },
  { number: '02/03', title: 'Shopping Assistance', description: 'From groceries to everyday errands, get help picking up what you need — reliably and on your schedule.', image: '/assets/hepki-home/shopping.jpg', alt: 'A helpful companion carrying groceries while shopping' },
  { number: '03/03', title: 'Gym Help', description: 'A motivating companion for your workouts — someone to keep you accountable and moving toward your goals.', image: '/assets/hepki-home/gym.jpg', alt: 'A fitness companion helping during a gym session' },
];

const howItWorks = [
  { number: '01', title: 'Choose a service and book your Buddy your way', text: 'Need help now? Book instantly. Planning ahead? Schedule a Buddy for later. Need regular support? Choose a monthly plan that fits your routine.' },
  { number: '02', title: 'Follow the booking and confirm arrival securely', text: 'Stay updated from the moment your Buddy is on the way. At arrival, a shared OTP helps confirm the right person is at your door.' },
  { number: '03', title: 'Get trusted help from a verified, rated Buddy', text: 'Buddies complete identity and background checks before accepting tasks. Ratings after every booking keep quality visible and accountable.' },
];

const bookingModes = [
  { icon: 'bolt', title: 'Instant', text: 'Need help right now? Request a nearby verified Buddy and get matched as soon as one is available.' },
  { icon: 'calendar', title: 'Scheduled', text: 'Plan ahead, choose a date and time, and have your Buddy arrive when your day needs them.' },
  { icon: 'repeat', title: 'Monthly', text: 'Build a routine with recurring visits and one dedicated Buddy who gets to know what works for you.' },
];

const safetyFeatures = [
  { icon: 'shield', title: 'Verified Buddies', text: 'Identity and background verification before a Buddy can take their first booking.' },
  { icon: 'pin', title: 'Live Booking Status', text: 'Follow every stage of the visit, from confirmed and en route to completion.' },
  { icon: 'key', title: 'OTP Arrival', text: 'A shared one-time password confirms your Buddy before the task begins.' },
  { icon: 'user', title: 'Buddy Preference', text: 'Choose the support that makes you feel comfortable wherever availability allows.' },
  { icon: 'star', title: 'Rated Every Time', text: 'Customers rate every completed task so service quality remains clear and visible.' },
  { icon: 'chat', title: 'In-App Support', text: 'Questions during a booking? Help is available through our support experience.' },
];

const customerFaqs = [
  ['What services does Hepki offer?', 'Hepki connects you with trusted help for hospital visits, shopping, fitness support and other everyday tasks available in your area.'],
  ['How do I book a Buddy?', 'Choose a service, select the booking mode and time that work for you, add your address and confirm. We will use those details to find an available Buddy.'],
  ['Are Buddies verified and background-checked?', 'Verification is a core part of Buddy onboarding. Identity, required documents and onboarding checks are reviewed before a Buddy can provide services.'],
  ['Can I cancel or reschedule a booking?', 'You can manage supported booking actions from your bookings area. Available options depend on the current stage of your booking.'],
];

const buddyFaqs = [
  ['How do I become a Hepki Buddy?', 'Open the Buddy onboarding flow, verify your phone number, complete your profile and services, then submit the required identity documents for review.'],
  ['Can I choose the services I provide?', 'Yes. During onboarding you can select the active services that match your skills and the kind of help you want to offer.'],
  ['When can I start accepting bookings?', 'You can begin after your profile, service information and verification documents have been reviewed and approved.'],
];

function Icon({ name, size = 24 }: { name: string; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  if (name === 'bolt') return <svg {...common}><path d="m13 2-9 12h8l-1 8 9-12h-8l1-8Z" /></svg>;
  if (name === 'calendar') return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></svg>;
  if (name === 'repeat') return <svg {...common}><path d="m17 1 4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3" /></svg>;
  if (name === 'shield') return <svg {...common}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></svg>;
  if (name === 'pin') return <svg {...common}><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>;
  if (name === 'key') return <svg {...common}><circle cx="8" cy="15" r="4" /><path d="m11 12 9-9M18 5l2 2M15 8l2 2" /></svg>;
  if (name === 'user') return <svg {...common}><circle cx="12" cy="7" r="4" /><path d="M4 22c.7-5 3.3-8 8-8s7.3 3 8 8" /></svg>;
  if (name === 'star') return <svg {...common}><path d="m12 2.5 3 6 6.5 1-4.7 4.6 1.1 6.4-5.9-3-5.9 3 1.1-6.4-4.7-4.6 6.5-1 3-6Z" /></svg>;
  if (name === 'chat') return <svg {...common}><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8ZM8 9h8M8 13h5" /></svg>;
  if (name === 'clock') return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
  if (name === 'check') return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>;
  if (name === 'wallet') return <svg {...common}><path d="M4 6h14a2 2 0 0 1 2 2v11H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12M15 12h5" /></svg>;
  if (name === 'arrow') return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="9" /></svg>;
}

function StoreButton({ store }: { store: 'Apple' | 'Google' }) {
  return <span className="hpStoreButton" aria-label={`${store === 'Apple' ? 'Download on the App Store' : 'Get it on Google Play'} — coming soon`}><span className="hpStoreIcon" aria-hidden="true">{store === 'Apple' ? '●' : '▶'}</span><span><small>{store === 'Apple' ? 'Download on the' : 'GET IT ON'}</small><strong>{store === 'Apple' ? 'App Store' : 'Google Play'}</strong></span></span>;
}

export default function Home() {
  return (
    <div className="hepkiHome">
      <ScrollAnimations />
      <section className="hpHero" aria-labelledby="home-title">
        <div className="hpHeroOrb hpHeroOrbOne" aria-hidden="true" /><div className="hpHeroOrb hpHeroOrbTwo" aria-hidden="true" />
        <div className="hpContainer hpHeroInner">
          <div className="hpHeroCopy" data-hp-reveal="left" data-hp-reveal-immediate><p className="hpEyebrow">Care that shows up</p><h1 id="home-title">Beyond distance,<br />we bring <em>care</em><br />and support.</h1><p className="hpHeroLead">Hepki connects people who need a hand with trusted Buddies for everyday tasks — making each day easier, safer and a little happier.</p><div className="hpHeroActions"><Link href="/book" className="hpButton hpButtonPrimary">Book Assistance <Icon name="arrow" size={18} /></Link><a href="#services" className="hpTextLink">Explore services <span aria-hidden="true">↓</span></a></div></div>
          <div className="hpHeroArt" data-hp-reveal="scale" data-hp-reveal-immediate aria-label="A Hepki Buddy ready to help"><div className="hpHeroShape"><Image src="/assets/welcome-hero.png" alt="A friendly Hepki Buddy helping a customer" width={1264} height={848} priority sizes="(max-width: 800px) 92vw, 52vw" /></div><div className="hpHeroNote hpHeroNoteTop"><span className="hpStatusDot" /> Verified help</div><div className="hpHeroNote hpHeroNoteBottom"><strong>4.9</strong><span>★ trusted by<br />our customers</span></div></div>
        </div>
      </section>

      <section className="hpSection hpServices" id="services" aria-labelledby="services-title"><div className="hpContainer"><div className="hpSectionIntro hpSectionIntroSplit" data-hp-reveal><div><p className="hpEyebrow">Our services</p><h2 id="services-title">Everyday help,<br /><em>on demand.</em></h2></div><p>From hospitals to gyms, book a verified Buddy for the support you need — on the spot, scheduled ahead or as part of your monthly routine.</p></div><div className="hpServiceGrid" data-hp-reveal-group>{services.map(service => <article className="hpServiceCard" key={service.title} data-hp-reveal><div className="hpServiceImage"><Image src={service.image} alt={service.alt} fill sizes="(max-width: 760px) 92vw, 31vw" /></div><div className="hpServiceBody"><span>{service.number}</span><h3>{service.title}</h3><p>{service.description}</p></div></article>)}</div><div className="hpCenteredAction" data-hp-reveal><Link href="/services" className="hpButton hpButtonOutline">View All Services <Icon name="arrow" size={17} /></Link></div></div><div className="hpLiveCatalog" data-hp-reveal><Suspense fallback={<div className="hpContainer"><p role="status">Loading available categories…</p></div>}><TopCategories /></Suspense></div></section>

      <section className="hpSection hpHow" id="how-it-works" aria-labelledby="how-title"><div className="hpContainer hpHowGrid"><div className="hpStickyHeading" data-hp-reveal="left"><p className="hpEyebrow hpEyebrowLight">How it works</p><h2 id="how-title">Help in three<br /><em>simple steps.</em></h2><p>Thoughtfully designed from booking to completion, so getting support always feels clear.</p></div><ol className="hpHowList" data-hp-reveal-group>{howItWorks.map(item => <li key={item.number} data-hp-reveal="right"><span className="hpHowNumber">{item.number}</span><div><h3>{item.title}</h3><p>{item.text}</p></div></li>)}</ol></div></section>

      <section className="hpSection hpModes" aria-labelledby="modes-title"><div className="hpContainer"><div className="hpSectionIntro hpCentered" data-hp-reveal><p className="hpEyebrow">Booking modes</p><h2 id="modes-title">Book <em>your way.</em></h2><p>Three flexible ways to book, so help fits the way your day actually works.</p></div><div className="hpModeGrid" data-hp-reveal-group>{bookingModes.map((mode, index) => <article className={index === 1 ? 'hpModeCard hpModeCardFeatured' : 'hpModeCard'} key={mode.title} data-hp-reveal><span className="hpModeIcon"><Icon name={mode.icon} /></span><span className="hpModeIndex">0{index + 1}</span><h3>{mode.title}</h3><p>{mode.text}</p><Link href="/book" aria-label={`Book ${mode.title.toLowerCase()} assistance`}><Icon name="arrow" size={18} /></Link></article>)}</div></div></section>

      <section className="hpSection hpMonthly" aria-labelledby="monthly-title"><div className="hpContainer hpMonthlyGrid"><div className="hpMonthlyCopy" data-hp-reveal="left"><p className="hpEyebrow">Monthly packages</p><h2 id="monthly-title">One Buddy.<br /><em>All month.</em></h2><p>With recurring support, you do not need to start from zero every visit. Your dedicated Buddy learns your routine, preferences and the kind of help that makes a difference.</p><ul>{['The same trusted Buddy for recurring visits', 'Support for a consistent weekly routine', 'Manage your bookings in one place', 'Clear payment before you confirm'].map(item => <li key={item}><span><Icon name="check" size={15} /></span>{item}</li>)}</ul><Link href="/book" className="hpButton hpButtonDark">Explore Monthly Help <Icon name="arrow" size={17} /></Link></div><div className="hpBuddyCardWrap" data-hp-reveal="scale"><div className="hpBuddyCard"><div className="hpBuddyCardHead"><span>Your Buddy</span><span className="hpVerifiedPill"><Icon name="shield" size={13} /> Verified</span></div><div className="hpBuddyProfile"><Image src="/assets/default-buddy-avatar.jpg" alt="Example verified Hepki Buddy profile" width={736} height={981} /><div><h3>Your dedicated Buddy</h3><p><span>4.9 ★</span> Highly rated</p></div></div><div className="hpBuddySchedule"><div><small>YOUR ROUTINE</small><strong>Mon · Wed · Fri</strong></div><Icon name="calendar" /></div><div className="hpBuddyFooter"><span className="hpStatusDot" /> Assigned to you throughout the month</div></div><span className="hpDoodle hpDoodleOne" aria-hidden="true">✦</span><span className="hpDoodle hpDoodleTwo" aria-hidden="true">⌁</span></div></div></section>

      <section className="hpTrust" aria-labelledby="trust-title"><div className="hpContainer hpTrustGrid" data-hp-reveal><div><p className="hpEyebrow hpEyebrowLight">Why Hepki</p><h2 id="trust-title">Built on <em>trust.</em></h2><p>Verified support, secure starts and visible progress at every stage of your booking.</p></div><div className="hpStats" data-hp-reveal-group><div data-hp-reveal><strong>3</strong><span>Booking<br />modes</span></div><div data-hp-reveal><strong>100%</strong><span>Buddy<br />verification</span></div><div data-hp-reveal><strong>Live</strong><span>Booking<br />updates</span></div></div></div></section>

      <section className="hpSection hpSafety" id="safety" aria-labelledby="safety-title"><div className="hpContainer"><div className="hpSectionIntro hpSectionIntroSplit" data-hp-reveal><div><p className="hpEyebrow">Safety first</p><h2 id="safety-title">Help you can<br /><em>rely on.</em></h2></div><p>Every layer of a Hepki booking is built for peace of mind — from who shows up to how your task gets started.</p></div><div className="hpSafetyGrid" data-hp-reveal-group>{safetyFeatures.map(feature => <article key={feature.title} data-hp-reveal><span><Icon name={feature.icon} /></span><h3>{feature.title}</h3><p>{feature.text}</p></article>)}</div><div className="hpCenteredAction" data-hp-reveal><Link href="/safety" className="hpTextLink hpTextLinkDark">Learn about safety <Icon name="arrow" size={17} /></Link></div></div></section>

      <section className="hpSection hpPricing" id="pricing" aria-labelledby="pricing-title"><div className="hpContainer hpPricingGrid"><div className="hpPricingTitle" data-hp-reveal="left"><p className="hpEyebrow">Pricing</p><h2 id="pricing-title">Transparent,<br /><em>down to the minute.</em></h2><p>Know what you are paying before you confirm. Straightforward pricing without unpleasant surprises.</p><Link href="/services" className="hpButton hpButtonPrimary">Explore Services <Icon name="arrow" size={17} /></Link></div><div className="hpPricingList" data-hp-reveal-group><article data-hp-reveal><span><Icon name="clock" /></span><div><h3>Clear service rates</h3><p>Available prices are shown before you confirm your booking.</p></div></article><article data-hp-reveal><span><Icon name="calendar" /></span><div><h3>Flexible booking modes</h3><p>Choose instant, scheduled or recurring support based on availability.</p></div></article><article data-hp-reveal><span><Icon name="repeat" /></span><div><h3>Manage your time</h3><p>Your booking details keep the agreed schedule clear for everyone.</p></div></article><article data-hp-reveal><span><Icon name="wallet" /></span><div><h3>No hidden surprises</h3><p>Review the payable amount and booking details before confirmation.</p></div></article></div></div></section>

      <section className="hpCoverage" aria-labelledby="coverage-title"><div className="hpContainer"><div className="hpCoverageCopy" data-hp-reveal="left"><p className="hpEyebrow hpEyebrowLight">Coverage</p><h2 id="coverage-title">Where we are.</h2><p>Hepki is growing thoughtfully. Availability varies by service and the address entered during booking.</p></div><div className="hpCities" data-hp-reveal-group aria-label="Cities"><span data-hp-reveal>Jaipur</span><span data-hp-reveal>Delhi NCR</span><span data-hp-reveal>Mumbai</span><span data-hp-reveal>Bengaluru</span><span data-hp-reveal>Pune</span><span className="hpComingCity" data-hp-reveal>More coming soon</span></div></div></section>

      <section className="hpSection hpApp" id="download" aria-labelledby="app-title"><div className="hpContainer hpAppCard"><div className="hpAppMockup" data-hp-reveal="left"><div className="hpPhone"><div className="hpPhoneTop" /><div className="hpPhoneScreen"><Image src="/assets/hepki-logo.png" alt="" width={54} height={54} /><strong>Good morning</strong><small>How can we help today?</small><div className="hpPhoneService"><span>Hospital visit</span><span>→</span></div><div className="hpPhoneService"><span>Shopping help</span><span>→</span></div><div className="hpPhoneBuddy"><span className="hpStatusDot" /> Buddies available nearby</div></div></div></div><div className="hpAppCopy" data-hp-reveal="right"><p className="hpEyebrow hpEyebrowLight">Get the app</p><h2 id="app-title">Hepki, in<br /><em>your pocket.</em></h2><p>Book a Buddy, follow your visit and manage every booking from one simple experience.</p><div className="hpStoreButtons"><StoreButton store="Apple" /><StoreButton store="Google" /></div><small className="hpComingNote">Mobile apps coming soon</small></div></div></section>

      <section className="hpRefer"><div className="hpContainer hpReferInner" data-hp-reveal><span className="hpReferIcon" aria-hidden="true">✦</span><div><p className="hpEyebrow">Refer & earn</p><h2>Good help is worth sharing.</h2><p>Invite friends and family to discover trusted everyday assistance with Hepki.</p></div><Link href="/contact" className="hpButton hpButtonDark">Invite Friends <Icon name="arrow" size={17} /></Link></div></section>

      <section className="hpSection hpForBuddies" id="become-a-buddy" aria-labelledby="buddies-title"><div className="hpContainer"><div className="hpSectionIntro hpSectionIntroSplit" data-hp-reveal><div><p className="hpEyebrow hpEyebrowLight">For Buddies</p><h2 id="buddies-title">Earn on your terms.<br /><em>Help on your terms.</em></h2></div><p>Set your services and availability, complete your verification and build meaningful work around your day.</p></div><div className="hpBuddyBenefits" data-hp-reveal-group><article data-hp-reveal><span><Icon name="calendar" /></span><h3>Flexible, self-directed work</h3><p>Choose your services and the area where you want to provide support.</p></article><article data-hp-reveal><span><Icon name="wallet" /></span><h3>Clear task information</h3><p>Review the task details available to you before moving forward.</p></article><article data-hp-reveal><span><Icon name="shield" /></span><h3>Safety built into each task</h3><p>Verification and OTP-supported starts help protect both sides of a booking.</p></article></div><div className="hpBuddyCta" data-hp-reveal="scale"><div><small>READY TO GET STARTED?</small><h3>Become a Hepki Buddy</h3><p>Complete a guided onboarding process and help people in your city.</p></div><ol><li><span>1</span>Verify your phone and profile</li><li><span>2</span>Choose your services and area</li><li><span>3</span>Submit your verification details</li><li><span>4</span>Start after approval</li></ol><Link href="/become-a-buddy" className="hpButton hpButtonAmber">Join Hepki <Icon name="arrow" size={17} /></Link></div></div></section>

      <section className="hpSection hpFaq" id="faqs" aria-labelledby="faq-title"><div className="hpContainer hpFaqGrid"><div className="hpFaqIntro" data-hp-reveal="left"><p className="hpEyebrow">FAQs</p><h2 id="faq-title">Frequently asked<br /><em>questions.</em></h2><p>Booking help or earning as a Buddy — if it is not answered here, our support team can help.</p><Link href="/contact" className="hpTextLink hpTextLinkDark">Contact us <Icon name="arrow" size={17} /></Link></div><div className="hpFaqColumns" data-hp-reveal="right"><div><h3>For customers</h3>{customerFaqs.map(([question, answer], index) => <details key={question} open={index === 0}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div><div><h3>For Buddies</h3>{buddyFaqs.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></div></div></section>
    </div>
  );
}
