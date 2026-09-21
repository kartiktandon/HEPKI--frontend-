import Link from 'next/link';
import CategoryImage from './CategoryImage';
import { id, money, record, safeImage, servicePrice, text, type RecordData } from '@/lib/api/models';

export default function DiscoveryServiceCard({
  service,
  isRecommended,
  badgeText,
}: {
  service: RecordData;
  isRecommended?: boolean;
  badgeText?: string;
}) {
  const category = record(service.categoryId ?? service.category);
  const categoryId = id(service.categoryId) || id(category);
  const categoryName = text(category.categoryName ?? category.name);
  const images = Array.isArray(service.images) ? service.images.map(record) : [];
  const image = safeImage(service.image ?? service.icon ?? images.find(value => value.isPrimary)?.url ?? images[0]?.url);
  const price = servicePrice(service);
  const serviceName = text(service.serviceName ?? service.name, 'Service');
  const minDuration = typeof service.minDurationHours === 'number' || typeof service.minDurationHours === 'string'
    ? String(service.minDurationHours)
    : '';
  const isHourly = service.pricingType === 'hourly';

  const badge = badgeText || (isRecommended ? '⭐ Recommended' : '⚡ Popular');

  return (
    <article className={`categoryCard discoveryCard ${isRecommended ? 'recommendedHighlight' : ''}`}>
      <div className="categoryImage">
        <CategoryImage src={image} alt={serviceName} />
        <span className={`discoveryTagBadge ${isRecommended ? 'tagBadgeRecommended' : ''}`}>
          {badge}
        </span>
      </div>
      <div className="categoryBody">
        <div className="discoveryMetaRow">
          {categoryName && (
            <span className="discoveryCategoryChip">
              {categoryName}
            </span>
          )}
          {minDuration ? (
            <span className="discoveryPill duration">
              ⏱ {minDuration}h min
            </span>
          ) : null}
          <span className="discoveryPill type">
            {isHourly ? 'Hourly' : 'Fixed'}
          </span>
        </div>
        <h3 className="discoveryServiceTitle" title={serviceName}>{serviceName}</h3>
        <p className="discoveryServiceDesc">{text(service.description, 'Book verified assistance for this service on your preferred schedule.')}</p>
        <div className="cardFooter">
          <div className="discoveryPriceCol">
            <span className="discoveryPriceLabel">Starting from</span>
            <strong className="discoveryPriceVal">
              {price !== undefined ? `${money(price)}${isHourly ? '/hr' : ''}` : 'View service'}
            </strong>
          </div>
          <Link
            href={categoryId ? `/book?category=${encodeURIComponent(categoryId)}` : '/book'}
            className="discoveryBookBtn"
            aria-label={`Book ${serviceName}`}
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
