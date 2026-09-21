import Link from 'next/link';
import { serverGet } from '@/lib/api/server';
import { id, list, money, record, safeImage, servicePrice, text, type RecordData } from '@/lib/api/models';
import CategoryImage from './CategoryImage';
import ServerReadError from './ServerReadError';

function formatServiceRate(service: RecordData): string {
  const price = servicePrice(service);
  const isHourly = service.pricingType === 'hourly';
  if (typeof price === 'number' && Number.isFinite(price) && price > 0) {
    return `${money(price)}${isHourly ? '/hr' : ''}`;
  }
  if (typeof service.hourlyRate === 'number' && Number.isFinite(service.hourlyRate) && service.hourlyRate > 0) {
    return `${money(service.hourlyRate)}/hr`;
  }
  return 'Price not available';
}

export default async function PopularServicesSection() {
  let data: unknown;
  try {
    try {
      data = await serverGet('/api/v1/user/services/popular?limit=4');
    } catch {
      data = await serverGet('/api/v1/user/services?limit=4');
    }
  } catch (error) {
    return (
      <section className="section popularServicesSection">
        <div className="container">
          <ServerReadError message={error instanceof Error ? error.message : 'Could not load popular services.'} />
        </div>
      </section>
    );
  }
  const raw = list(data, 'services');
  const items = (raw.length ? raw : list(data)).slice(0, 4).map(service => {
    const categoryRec = record(service.categoryId ?? service.category);
    const categoryId = id(service.categoryId) || id(categoryRec);
    const images = Array.isArray(service.images) ? service.images.map(record) : [];
    return {
      id: id(service),
      categoryId,
      title: text(service.serviceName ?? service.name ?? service.title, 'Service'),
      description: text(service.description, 'Description not available.'),
      rate: formatServiceRate(service),
      image: safeImage(service.image ?? service.icon ?? images.find(value => value.isPrimary)?.url ?? images[0]?.url),
    };
  });

  return (
    <section className="section popularServicesSection">
      <div className="container">
        <div className="sectionHeaderRow">
          <div>
            <h2 className="sectionTitle">Popular services</h2>
            <p className="sectionSubtitle">Trusted help, at your convenience.</p>
          </div>
          <Link href="/services" className="viewAllLink">
            View all services <span className="linkArrow">→</span>
          </Link>
        </div>

        {items.length ? <div className="popularServicesGrid">
          {items.map(svc => (
            <Link key={svc.id} href={svc.categoryId ? `/book?category=${encodeURIComponent(svc.categoryId)}` : '/book'} className="popularServiceCard">
              <div className="popularServiceThumb">
                <CategoryImage src={svc.image} alt={svc.title} />
              </div>
              <div className="popularServiceBody">
                <div className="popularServiceTop">
                  <h4>{svc.title}</h4>
                  <p>{svc.description}</p>
                </div>
                <div className="popularServiceBottom">
                  <span className="popularPrice">{svc.rate}</span>
                  <span className="cardCircleBtn" aria-hidden="true">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div> : <p className="emptyState">No popular services are available right now. Please check again later.</p>}
      </div>
    </section>
  );
}
