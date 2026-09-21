import { Suspense } from 'react';
import LandingHero from '@/components/LandingHero';
import HowItWorks from '@/components/HowItWorks';
import TopCategories from '@/components/TopCategories';
import PopularServicesSection from '@/components/PopularServicesSection';
import SafetyBanner from '@/components/SafetyBanner';
import AppBanner from '@/components/AppBanner';

export default function Home() {
  return (
    <>
      <LandingHero />
      <HowItWorks />
      <Suspense fallback={<section className="section topCategoriesSection"><div className="container"><p role="status">Loading categories…</p></div></section>}>
        <TopCategories />
      </Suspense>
      <Suspense fallback={<section className="section popularServicesSection"><div className="container"><p role="status">Loading popular services…</p></div></section>}>
        <PopularServicesSection />
      </Suspense>
      <SafetyBanner />
      <AppBanner />
    </>
  );
}
