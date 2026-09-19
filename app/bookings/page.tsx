import BookingsClient from '@/components/BookingsClient';
import { initialUserResource } from '@/lib/api/server';
export const metadata = { title: 'My Bookings' };
export default async function BookingsPage() {
  const initial = await initialUserResource('/api/v1/user/bookings?page=1&limit=10');
  return <BookingsClient initial={initial}/>;
}
