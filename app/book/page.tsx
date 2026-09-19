import { serverGet } from '@/lib/api/server';
import BookingWizard from '@/components/BookingWizard';
export const metadata = { title: 'Book a Buddy' };
export default async function BookPage(){const path = '/api/v1/user/services/categories'; const initialCatalog = await serverGet(path).then(data => ({ path, data })).catch(() => undefined); return <section className="section pageTop"><div className="container narrow"><div className="sectionHeading centered"><span className="eyebrow">BOOKING</span><h1>Book a Buddy</h1><p>Complete your booking in a few quick steps.</p></div><BookingWizard initialCatalog={initialCatalog}/></div></section>}
