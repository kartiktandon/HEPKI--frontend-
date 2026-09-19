import { serverGet } from '@/lib/api/server';
import BookingWizard from '@/components/BookingWizard';

export const metadata = {
  title: 'Book a Buddy | Hepki',
  description: 'Book verified buddies for on-demand assistance, errands, chores, and everyday support.',
};

export default async function BookPage() {
  const path = '/api/v1/user/services/categories';
  const initialCatalog = await serverGet(path)
    .then(data => ({ path, data }))
    .catch(() => undefined);

  return (
    <section className="section pageTop" style={{ minHeight: '80vh', paddingBottom: '72px' }}>
      <div className="container narrow">
        <div className="sectionHeading centered" style={{ marginBottom: '32px' }}>
          <span className="eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span>⚡</span> INSTANT & RELIABLE
          </span>
          <h1 style={{ letterSpacing: '-0.03em', margin: '8px 0 12px' }}>Book a Buddy</h1>
          <p style={{ color: 'var(--muted)', fontSize: '16px', maxWidth: '520px', margin: '0 auto' }}>
            Get paired with a top-rated, background-checked Buddy in just a few simple steps.
          </p>
        </div>
        <BookingWizard initialCatalog={initialCatalog} />
      </div>
    </section>
  );
}
