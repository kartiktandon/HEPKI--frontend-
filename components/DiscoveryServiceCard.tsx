import Link from 'next/link';
import CategoryImage from './CategoryImage';
import { id, money, record, safeImage, servicePrice, text, type RecordData } from '@/lib/api/models';

export default function DiscoveryServiceCard({ service }: { service: RecordData }) {
  const category = record(service.categoryId ?? service.category);
  const categoryId = id(service.categoryId) || id(category);
  const images = Array.isArray(service.images) ? service.images.map(record) : [];
  const image = safeImage(service.image ?? service.icon ?? images.find(value => value.isPrimary)?.url ?? images[0]?.url);
  const price = servicePrice(service);
  const serviceName = text(service.serviceName ?? service.name, 'Service');
  const minDuration = typeof service.minDurationHours === 'number' || typeof service.minDurationHours === 'string'
    ? String(service.minDurationHours)
    : '';
  const isHourly = service.pricingType === 'hourly';

  return (
    <article className="categoryCard discoveryCard">
      <div className="categoryImage">
        <CategoryImage src={image} alt={serviceName} />
        <span className="discoveryTagBadge">
          <span className="trendingFlame">⚡</span> Popular
        </span>
      </div>
      <div className="categoryBody">
        <div className="discoveryMetaRow">
          {minDuration ? (
            <span className="discoveryPill duration">
              ⏱ {minDuration}h min
            </span>
          ) : null}
          <span className="discoveryPill type">
            {isHourly ? 'Hourly Rate' : 'Fixed Price'}
          </span>
        </div>
        <h3>{serviceName}</h3>
        <p>{text(service.description, 'Book verified assistance for this service on your preferred schedule.')}</p>
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
          >
            Book <span className="btnArrow">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
