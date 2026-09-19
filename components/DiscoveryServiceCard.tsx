import Link from 'next/link';
import CategoryImage from './CategoryImage';
import { id, money, record, safeImage, servicePrice, text, type RecordData } from '@/lib/api/models';

export default function DiscoveryServiceCard({ service }: { service: RecordData }) {
  const category = record(service.categoryId ?? service.category);
  const categoryId = id(service.categoryId) || id(category);
  const images = Array.isArray(service.images) ? service.images.map(record) : [];
  const image = safeImage(service.image ?? service.icon ?? images.find(value => value.isPrimary)?.url ?? images[0]?.url);
  const price = servicePrice(service);
  return <article className="categoryCard discoveryCard">
    <div className="categoryImage"><CategoryImage src={image} alt={text(service.serviceName ?? service.name, 'Service')} /></div>
    <div className="categoryBody">
      <h3>{text(service.serviceName ?? service.name, 'Service')}</h3>
      <p>{text(service.description, 'Choose a time and address that works for you.')}</p>
      <div className="cardFooter"><strong>{price !== undefined ? `From ${money(price)}${service.pricingType === 'hourly' ? '/hr' : ''}` : 'View service'}</strong><Link href={categoryId ? `/book?category=${encodeURIComponent(categoryId)}` : '/book'}>Book →</Link></div>
    </div>
  </article>;
}
