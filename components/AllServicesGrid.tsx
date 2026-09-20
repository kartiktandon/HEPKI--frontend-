import { serverGet } from '@/lib/api/server';
import { id, list } from '@/lib/api/models';
import DiscoveryServiceCard from '@/components/DiscoveryServiceCard';
import ServerReadError from '@/components/ServerReadError';

export default async function AllServicesGrid() {
  let data: unknown;
  try { data = await serverGet('/api/v1/user/services?limit=50'); }
  catch (error) {
    return <ServerReadError message={error instanceof Error ? error.message : 'Could not load services.'} />;
  }
  const raw = list(data, 'services');
  const items = raw.length ? raw : list(data);
  if (!items.length) {
    return <p className="emptyState">No services are available right now. Please check again later.</p>;
  }
  return (
    <div className="categoryGrid discoveryGrid">
      {items.map((service, index) => (
        <DiscoveryServiceCard
          key={String(id(service) || index)}
          service={service}
        />
      ))}
    </div>
  );
}

