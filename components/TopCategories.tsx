import Link from 'next/link';
import { serverGet } from '@/lib/api/server';
import { category, list } from '@/lib/api/models';
import CategoryImage from './CategoryImage';
import ServerReadError from './ServerReadError';

function CategoryIcon({ name }: { name: string }) {
  const l = name.toLowerCase();
  if (l.includes('hosp') || l.includes('medic') || l.includes('companion')) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    );
  }
  if (l.includes('shop') || l.includes('grocer') || l.includes('errand')) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    );
  }
  if (l.includes('gym') || l.includes('fit')) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m6.5 6.5 11 11" /><path d="m21 21-1-1" /><path d="m3 3 1 1" /><path d="m18 22 4-4" />
      </svg>
    );
  }
  if (l.includes('pet') || l.includes('dog') || l.includes('cat')) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="4" r="2" /><circle cx="18" cy="8" r="2" /><circle cx="20" cy="16" r="2" />
        <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

export default async function TopCategories() {
  let data: unknown;
  try {
    data = await serverGet('/api/v1/user/services/categories');
  } catch (error) {
    return (
      <section className="section topCategoriesSection">
        <div className="container">
          <ServerReadError message={error instanceof Error ? error.message : 'Could not load categories.'} />
        </div>
      </section>
    );
  }
  const items = list(data).slice(0, 5).map(category);

  return (
    <section className="section topCategoriesSection">
      <div className="container">
        <div className="sectionHeaderRow">
          <div>
            <h2 className="sectionTitle">Top categories</h2>
            <p className="sectionSubtitle">Find help for every part of your day.</p>
          </div>
          <Link href="/categories" className="viewAllLink">
            View all categories <span className="linkArrow">→</span>
          </Link>
        </div>

        {items.length ? <div className="topCategoriesGrid">
          {items.map(item => (
            <Link key={item.id} href={`/book?category=${encodeURIComponent(item.id)}`} className="topCategoryCard">
              <div className="topCategoryImgWrap">
                <CategoryImage src={item.image} alt={item.name} />
              </div>
              <div className="topCategoryBottom">
                <div className="topCategoryIconBadge" aria-hidden="true">
                  <CategoryIcon name={item.name} />
                </div>
                <div className="topCategoryInfo">
                  <h3>{item.name}</h3>
                  <p>{item.description || 'Description not available.'}</p>
                </div>
                <span className="cardCircleBtn" aria-hidden="true">→</span>
              </div>
            </Link>
          ))}
        </div> : <p className="emptyState">No categories are available right now. Please check again later.</p>}
      </div>
    </section>
  );
}
