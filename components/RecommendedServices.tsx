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
  if (loading) return <p role="status">Checking your account…</p>;
  if (!user) return <div className="discoveryPrompt"><p>Sign in to see services based on your past bookings.</p><Link className="secondaryButton" href="/auth?next=%2F">Log in</Link></div>;
  return <div className="stack"><ErrorNotice message={bookings.error} retry={bookings.reload}/><ErrorNotice message={services.error} retry={services.reload}/>
    {(bookings.loading || services.loading) && <p role="status">Finding services for you…</p>}
    {!bookings.loading && !bookings.error && !categoryId && <p className="emptyState">After your first booking, services from that category will appear here.</p>}
    {categoryId && !services.loading && !services.error && (recommendations.length ? <div className="categoryGrid">{recommendations.slice(0, 4).map((service, index) => <DiscoveryServiceCard key={id(service) || index} service={service}/>)}</div> : <p className="emptyState">No active services in your recent category right now.</p>)}
  </div>;
}
