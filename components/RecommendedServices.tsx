'use client';
import Link from 'next/link';
import { useSession } from './SessionProvider';
import { useResource } from '@/lib/api/hooks';
import { ErrorNotice } from './ApiState';
import { id, list, record } from '@/lib/api/models';
import DiscoveryServiceCard from './DiscoveryServiceCard';

export default function RecommendedServices() {
  const { user, loading } = useSession();
  const bookings = useResource(user ? '/api/v1/user/bookings?page=1&limit=10' : null, 'user');
  const history = list(bookings.data, 'bookings');
  const items = history.length ? history : list(bookings.data);
  const categoryId = items.map(item => id(item.categoryId) || id(record(item.serviceId).categoryId)).find(Boolean);
  const services = useResource(user && categoryId ? `/api/v1/user/services?categoryId=${encodeURIComponent(categoryId)}` : null);
  const matches = list(services.data, 'services');
  const recommendations = matches.length ? matches : list(services.data);

  if (loading) {
    return (
      <div className="nearbyLoadingBox">
        <span className="spinner"></span>
        <p>Loading your recommendations…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="discoveryPrompt">
        <div className="discoveryPromptContent">
          <div className="discoveryPromptIcon">✨</div>
          <div>
            <h3>Personalized Service Recommendations</h3>
            <p>Sign in to view curated services and smart rebooking suggestions tailored to your history.</p>
          </div>
        </div>
        <div className="discoveryPromptActions">
          <Link className="primaryButton" href="/auth?next=%2F">
            Sign In to View <span className="btnArrow">→</span>
          </Link>
          <Link className="secondaryButton" href="/categories">
            Browse All Services
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="stack">
      <ErrorNotice message={bookings.error} retry={bookings.reload} />
      <ErrorNotice message={services.error} retry={services.reload} />

      {(bookings.loading || services.loading) && (
        <div className="nearbyLoadingBox">
          <span className="spinner"></span>
          <p>Finding recommended services for you…</p>
        </div>
      )}

      {!bookings.loading && !bookings.error && !categoryId && (
        <div className="discoveryEmptyCard">
          <span className="emptyCardIcon">💡</span>
          <h4>No booking history yet</h4>
          <p>Once you complete your first booking, custom suggestions and favorite services will appear here for fast re-booking.</p>
          <Link href="/categories" className="primaryButton small">
            Explore Categories <span className="btnArrow">→</span>
          </Link>
        </div>
      )}

      {categoryId && !services.loading && !services.error && (
        recommendations.length ? (
          <div className="categoryGrid">
            {recommendations.slice(0, 4).map((service, index) => (
              <DiscoveryServiceCard key={id(service) || index} service={service} />
            ))}
          </div>
        ) : (
          <div className="discoveryEmptyCard">
            <span className="emptyCardIcon">📂</span>
            <h4>No active services in this category</h4>
            <p>Check out our other trending categories for everyday assistance.</p>
            <Link href="/categories" className="secondaryButton">
              View All Categories
            </Link>
          </div>
        )
      )}
    </div>
  );
}
