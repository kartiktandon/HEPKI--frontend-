import Link from 'next/link';

export const metadata = { title: 'About Us' };

export default function Page() {
  return (
    <section className="section pageTop aboutSection">
      <div className="container narrow">
        <div className="sectionHeading centered">
          <span className="eyebrow">ABOUT HEPKI</span>
          <h1>Empowering students. Simplifying everyday help.</h1>
          <p>
            Hepki is India&apos;s trusted platform bridging household support with verified university student Buddies seeking dignified, flexible earning opportunities.
          </p>
        </div>

        <div className="aboutStatsRow">
          <div className="aboutStat">
            <strong>100%</strong>
            <span>Verified Student Buddies</span>
          </div>
          <div className="aboutStat">
            <strong>10+</strong>
            <span>Everyday Support Categories</span>
          </div>
          <div className="aboutStat">
            <strong>Fast & Safe</strong>
            <span>OTP & Secure Razorpay</span>
          </div>
        </div>

        <div className="aboutGrid">
          <div className="aboutCard">
            <div className="aboutCardHeader">
              <span className="aboutIcon">🎯</span>
              <h2>Our Mission</h2>
            </div>
            <p>
              To democratize everyday help by creating a safe, instant, and transparent network connecting busy residents with hardworking university students who want to earn on their own schedules.
            </p>
          </div>

          <div className="aboutCard">
            <div className="aboutCardHeader">
              <span className="aboutIcon">🚀</span>
              <h2>Our Vision</h2>
            </div>
            <p>
              To become the most reliable companion app across Indian cities for reliable task assistance, fostering a community built on mutual respect, verified safety, and fair compensation.
            </p>
          </div>

          <div className="aboutCard">
            <div className="aboutCardHeader">
              <span className="aboutIcon">🎓</span>
              <h2>Student Empowerment</h2>
            </div>
            <p>
              Students balance classes, exams, and personal expenses. Hepki gives students the autonomy to accept gigs in their free time, gain practical real-world experience, and fund their own education.
            </p>
          </div>

          <div className="aboutCard">
            <div className="aboutCardHeader">
              <span className="aboutIcon">🛡️</span>
              <h2>Trust & Safety First</h2>
            </div>
            <p>
              Every Buddy undergoes mandatory government ID verification and background checks. With OTP-based task start and emergency support, customer and buddy safety remain our highest priority.
            </p>
          </div>
        </div>

        <div className="aboutCtaBanner">
          <div>
            <h3>Ready to experience Hepki?</h3>
            <p>Find a verified student Buddy near you in just a few clicks.</p>
          </div>
          <div className="aboutCtaActions">
            <Link className="primaryButton" href="/book">Book a Buddy <span className="btnArrow">→</span></Link>
            <Link className="secondaryButton" href="/become-a-buddy">Become a Buddy</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
