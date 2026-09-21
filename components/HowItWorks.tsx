export default function HowItWorks() {
  return (
    <section className="section howItWorksSection">
      <div className="container">
        <div className="howItWorksRow">
          <div className="howItWorksHeading">
            <h2>How it works</h2>
            <p>Simple steps to get the help you need.</p>
          </div>

          <div className="howItWorksSteps">
            <div className="stepItem">
              <span className="stepNum">01</span>
              <span className="stepIcon" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </span>
              <div className="stepText">
                <h3>Choose Service</h3>
                <p>Browse from a wide range of services and categories.</p>
              </div>
            </div>

            <div className="stepArrow" aria-hidden="true">→</div>

            <div className="stepItem">
              <span className="stepNum">02</span>
              <span className="stepIcon" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </span>
              <div className="stepText">
                <h3>Book a Buddy</h3>
                <p>Select your preferred time, location and Buddy.</p>
              </div>
            </div>

            <div className="stepArrow" aria-hidden="true">→</div>

            <div className="stepItem">
              <span className="stepNum">03</span>
              <span className="stepIcon" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 14 14" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </span>
              <div className="stepText">
                <h3>Task Done</h3>
                <p>Your Buddy arrives and gets the job done.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
