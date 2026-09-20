export type RecordData = Record<string, unknown>;

const currencyFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
export function record(value: unknown): RecordData {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as RecordData : {};
}
export function unwrap(value: unknown): unknown {
  const object = record(value);
  return object.data ?? value;
}
export function list(value: unknown, key?: string): RecordData[] {
  const data = unwrap(value);
  const object = record(data);
  const items = Array.isArray(data) ? data : key ? object[key] : object.items;
  return Array.isArray(items) ? items.map(record) : [];
}
export function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : typeof value === 'number' ? String(value) : fallback;
}
export function id(value: unknown): string {
  if (typeof value === 'string') return value;
  const object = record(value);
  return text(object._id ?? object.id);
}
export function money(value: unknown): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? currencyFormatter.format(value) : 'Not available';
}
export function dateLabel(value: unknown, fallback = 'Next available'): string {
  const raw = text(value, fallback);
  return /^\d{4}-\d{2}-\d{2}/.test(raw) ? raw.slice(0, 10) : raw;
}
export function label(value: unknown): string {
  if (value === 'cod') return 'Cash on delivery';
  return text(value, 'Unknown').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
export function safeImage(value: unknown, fallback = '/assets/welcome-hero.png'): string {
  const url = text(value);
  return url.startsWith('https://') || (url.startsWith('/') && !url.startsWith('//')) ? url : fallback;
}
export interface Category {
  id: string; name: string; description: string; image: string; rate?: number;
}
export function category(value: RecordData): Category {
  const images = Array.isArray(value.images) ? value.images.map(record) : [];
  return { id: id(value), name: text(value.categoryName ?? value.name, 'Service category'),
    description: text(value.description), image: safeImage(value.icon ?? images.find(i => i.isPrimary)?.url ?? images[0]?.url),
    rate: typeof value.hourlyRate === 'number' && value.hourlyRate > 0 ? value.hourlyRate : undefined };
}
export function servicePrice(service: RecordData): number | undefined {
  if (service.pricingType === 'hourly' && typeof service.hourlyRate === 'number') return service.hourlyRate;
  const pricing = record(service.pricing);
  const price = pricing.finalPrice || pricing.retailPrice || pricing.basePrice;
  return typeof price === 'number' ? price : undefined;
}

/** Preserve API order and use the first booking with a known category. */
export function recommendationCategory(data: unknown): string | undefined {
  const bookings = list(data, 'bookings');
  for (const booking of bookings.length ? bookings : list(data)) {
    const categoryId = id(booking.categoryId) || id(record(booking.serviceId).categoryId);
    if (categoryId) return categoryId;
  }
}

/** Extract all unique category IDs from the user's booking history. */
export function recommendationCategories(data: unknown): string[] {
  const bookings = list(data, 'bookings');
  const items = bookings.length ? bookings : list(data);
  const seen = new Set<string>();
  const categories: string[] = [];
  for (const booking of items) {
    const categoryId = id(booking.categoryId) || id(record(booking.serviceId).categoryId);
    if (categoryId && !seen.has(categoryId)) {
      seen.add(categoryId);
      categories.push(categoryId);
    }
  }
  return categories;
}
