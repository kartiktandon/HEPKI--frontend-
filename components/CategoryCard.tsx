import Link from 'next/link';
import CategoryImage from './CategoryImage';
import { type Category, money } from '@/lib/api/models';

export default function CategoryCard({ item }: { item: Category }) {
  const priceDisplay = item.rate !== undefined ? `From ${money(item.rate)}/hr` : 'View services';

  return (
    <article className="categoryCard modernCard">
      <Link href={`/book?category=${encodeURIComponent(item.id)}`} className="categoryCardLink" tabIndex={-1} aria-hidden="true" />
      <div className="categoryImage">
        <CategoryImage src={item.image} alt={item.name} />
        <span className="categoryBadgeChip">
          <span className="sparkDot" />
          Verified Service
        </span>
      </div>

      <div className="categoryBody">
        <h3 className="categoryTitle">{item.name}</h3>
        <p className="categoryDesc">{item.description || 'Verified assistance tailored to your schedule and needs.'}</p>

        <div className="cardFooter">
          <div className="categoryPriceBox">
            <span className="rateLabel">Starting</span>
            <strong className="rateValue">{priceDisplay}</strong>
          </div>

          <Link
            href={`/book?category=${encodeURIComponent(item.id)}`}
            className="categoryActionBtn"
            aria-label={`Book ${item.name}`}
          >
            <span>Book</span>
            <span className="btnArrow" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </span>
          </Link>
        </div>
      </div>
    </article>
  );
}


