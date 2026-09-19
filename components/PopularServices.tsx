import { serverGet } from '@/lib/api/server';
import { list } from '@/lib/api/models';
import DiscoveryServiceCard from './DiscoveryServiceCard';
import ServerReadError from './ServerReadError';

export default async function PopularServices() {
  let data: unknown;
  try { data = await serverGet('/api/v1/user/services/popular?limit=4'); }
  catch (error) { return <ServerReadError message={error instanceof Error ? error.message : 'Could not load popular services.'}/>; }
  const services = list(data, 'services');
  const items = services.length ? services : list(data);
  return items.length ? <div className="categoryGrid">{items.slice(0, 4).map((service, index) => <DiscoveryServiceCard key={String(service._id ?? service.id ?? index)} service={service}/>)}</div>
    : <p className="emptyState">Popular services are not available right now.</p>;
}
