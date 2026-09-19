'use client';
import { useResource } from '@/lib/api/hooks';
import { category, list } from '@/lib/api/models';
import CategoryCard from './CategoryCard';
import { ErrorNotice } from './ApiState';

export default function Catalog({ limit }: { limit?: number }) {
  const { data, loading, error, reload } = useResource('/api/v1/user/services/categories');
  if (loading) return <p role="status">Loading services…</p>;
  if (error) return <ErrorNotice message={error} retry={reload}/>;

  const items = list(data);
  return items.length ? (
    <div className="categoryGrid">
      {items.slice(0, limit).map(value => {
        const item = category(value);
        return <CategoryCard key={item.id} item={item}/>;
      })}
    </div>
  ) : <p className="emptyState">No services are available right now. Please check again later.</p>;
}
