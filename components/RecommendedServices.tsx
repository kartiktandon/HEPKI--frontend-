'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useSession } from './SessionProvider';
import { useResource, type InitialResource } from '@/lib/api/hooks';
import { ErrorNotice } from './ApiState';
import { id, list, recommendationCategories, record, text } from '@/lib/api/models';
import DiscoveryServiceCard from './DiscoveryServiceCard';

const INITIAL_BATCH_COUNT = 6;

export default function RecommendedServices({
  initialBookings,
  initialServices,
}: {
  initialBookings?: InitialResource;
  initialServices?: InitialResource;
}) {
  const { user, loading: sessionLoading } = useSession();

  const bookings = useResource(user ? '/api/v1/user/bookings?page=1&limit=20' : null, 'user', 0, initialBookings);
  const services = useResource('/api/v1/user/services?limit=50', undefined, 0, initialServices);

  const rawList = list(services.data, 'services');
  const allServices = rawList.length ? rawList : list(services.data);

  // Extract all categories user has previously booked
  const userBookedCategoryIds = useMemo(() => {
    return new Set(recommendationCategories(bookings.data));
  }, [bookings.data]);


  // Sort: services from user's booked categories come first
  const sortedServices = useMemo(() => {
    if (!userBookedCategoryIds.size) return allServices;

    const prioritized: typeof allServices = [];
    const others: typeof allServices = [];

    for (const service of allServices) {
      const cat = record(service.categoryId ?? service.category);
      const catId = id(service.categoryId) || id(cat);
      if (catId && userBookedCategoryIds.has(catId)) {
        prioritized.push(service);
      } else {
        others.push(service);
      }
    }

    return [...prioritized, ...others];
  }, [allServices, userBookedCategoryIds]);

  // Show only the initial curated batch — full catalog is at /services
  const displayedServices = sortedServices.slice(0, INITIAL_BATCH_COUNT);

  return (
    <div className="stack discoveryStack">

      {/* Subtle sign-in nudge for logged-out users */}
      {!sessionLoading && !user && (
        <div className="discoverySignInNudge">
          <span className="nudgeIcon">✨</span>
          <span className="nudgeText">
            <strong>Sign in</strong> to get personalized recommendations based on your booking history.
          </span>
          <Link className="nudgeLink" href="/auth?next=%2F">
            Sign In →
          </Link>
        </div>
      )}


      {/* Errors & Loading State */}
      <ErrorNotice message={bookings.error} retry={bookings.reload} />
      <ErrorNotice message={services.error} retry={services.reload} />

      {services.loading && !allServices.length && (
        <div className="nearbyLoadingBox">
          <span className="spinner"></span>
          <p>Loading curated recommendations for you…</p>
        </div>
      )}

      {/* Services Grid */}
      {!services.loading && displayedServices.length > 0 && (
        <div className="categoryGrid discoveryGrid">
          {displayedServices.map((service, index) => {
            const cat = record(service.categoryId ?? service.category);
            const catId = id(service.categoryId) || id(cat);
            const isBooked = Boolean(catId && userBookedCategoryIds.has(catId));

            return (
              <DiscoveryServiceCard
                key={id(service) || index}
                service={service}
                isRecommended={isBooked}
                badgeText={isBooked ? '⭐ Recommended' : undefined}
              />
            );
          })}
        </div>
      )}

      {/* Empty State Fallback */}
      {!services.loading && !services.error && sortedServices.length === 0 && (
        <div className="discoveryEmptyCard">
          <span className="emptyCardIcon">🔍</span>
          <h4>No services available right now</h4>
          <p>Check back soon — new services are being added regularly.</p>
          <Link href="/categories" className="primaryButton small">
            Browse Categories <span className="btnArrow">→</span>
          </Link>
        </div>
      )}
    </div>
  );
}
