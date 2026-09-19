import { serverGet } from '@/lib/api/server';
import { category, list } from '@/lib/api/models';
import CategoryCard from './CategoryCard';
import ServerReadError from './ServerReadError';

export default async function Catalog({ limit }: { limit?: number }) {
  let data: unknown;
  try { data = await serverGet('/api/v1/user/services/categories'); }
  catch (error) { return <ServerReadError message={error instanceof Error ? error.message : 'Could not load services.'}/>; }
  const items = list(data);
  return items.length ? <div className="categoryGrid">{items.slice(0, limit).map(value => {
    const item = category(value);
    return <CategoryCard key={item.id} item={item}/>;
  })}</div> : <p className="emptyState">No services are available right now. Please check again later.</p>;
}
