import { serverGet } from '@/lib/api/server';
import { id, list } from '@/lib/api/models';
import DiscoveryServiceCard from './DiscoveryServiceCard';
import ServerReadError from './ServerReadError';

export default async function PopularServices() {
  let data: unknown;
  try { data = await serverGet('/api/v1/user/services/popular?limit=4'); }
  catch (error) {
    return <ServerReadError message={error instanceof Error ? error.message : 'Could not load popular services.'} />;
  }
  const raw = list(data, 'services');
  const items = raw.length ? raw : list(data);
  if (!items.length) return <p className="emptyState">Popular services are not available right now.</p>;
  return (
    <div className="categoryGrid discoveryGrid">
      {items.slice(0, 4).map((service, index) => (
        <DiscoveryServiceCard key={String(id(service) || index)} service={service} />
      ))}
    </div>
  );
}
