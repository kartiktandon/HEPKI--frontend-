import { Suspense } from 'react';
import AllServicesGrid from '@/components/AllServicesGrid';

export const metadata = { title: 'All Services — Hepki' };

export default function ServicesPage() {
  return (
    <section className="section pageTop">
      <div className="container">
        <div className="sectionHeading">
          <span className="eyebrow">All Services</span>
          <h1>Explore every service</h1>
          <p>Browse all available services from verified Buddies — book on-demand, pre-book, or set a monthly schedule.</p>
        </div>
        <Suspense fallback={
          <div className="nearbyLoadingBox">
            <span className="spinner"></span>
            <p>Loading all services…</p>
          </div>
        }>
          <AllServicesGrid />
        </Suspense>
      </div>
    </section>
  );
}
