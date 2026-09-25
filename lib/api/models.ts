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
export function bookingSchedule(bookingValue: unknown): { date: string; time: string } {
  const booking = record(bookingValue);
  const schedule = record(booking.schedule ?? booking.bookingSchedule ?? booking.scheduleDetails);
  const combined = text(
    booking.scheduledAt ?? booking.scheduledFor ?? booking.scheduleDateTime ??
    schedule.scheduledAt ?? schedule.scheduledFor ?? schedule.dateTime
  );
  const combinedMatch = combined.match(/^(\d{4}-\d{2}-\d{2})(?:[T\s](\d{2}:\d{2}))?/);
  return {
    date: text(
      booking.scheduledDate ?? booking.scheduleDate ?? booking.bookingDate ?? booking.serviceDate ??
      booking.preferredDate ?? schedule.scheduledDate ?? schedule.scheduleDate ?? schedule.date,
      combinedMatch?.[1]
    ),
    time: text(
      booking.timeSlot ?? booking.scheduledTime ?? booking.bookingTime ?? booking.serviceTime ??
      booking.preferredTime ?? schedule.timeSlot ?? schedule.scheduledTime ?? schedule.time,
      combinedMatch?.[2]
    ),
  };
}
export function label(value: unknown): string {
  if (value === 'cod') return 'Cash on delivery';
  return text(value, 'Unknown').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const TERMINAL_BOOKING_STATUSES = new Set([
  'completed', 'cancelled_by_user', 'cancelled_by_provider', 'cancelled_by_admin', 'failed',
]);

/**
 * A booking record can be created before its online payment is completed. Do
 * not present that record as booked/confirmed until the payment API says it is
 * paid. This only affects the customer-facing label; the backend remains the
 * source of truth for the underlying booking status.
 */
export function bookingDisplayStatus(bookingValue: unknown, paymentValue?: unknown): string {
  const booking = record(bookingValue);
  const embeddedPayment = record(booking.payment);
  const suppliedPayment = record(paymentValue);
  const payment = { ...embeddedPayment, ...suppliedPayment };
  const bookingStatus = text(booking.bookingStatus ?? booking.status, 'pending').toLowerCase();
  const paymentMethod = text(payment.method ?? booking.paymentMethod).toLowerCase();
  const paymentStatus = text(payment.status ?? booking.paymentStatus).toLowerCase();

  if (TERMINAL_BOOKING_STATUSES.has(bookingStatus) || paymentMethod === 'cod' || paymentStatus === 'paid') {
    return bookingStatus;
  }

  if (paymentMethod === 'online' && ['booked', 'confirmed'].includes(bookingStatus)) {
    return paymentStatus === 'failed' ? 'payment_failed' : 'payment_pending';
  }

  return bookingStatus;
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

