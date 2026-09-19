import BookingDetailsClient from '@/components/BookingDetailsClient';
import { initialUserResource } from '@/lib/api/server';
export const metadata = { title: 'Booking details' };
export default async function BookingDetailsPage({ params }: { params: { id: string } }) {
  const id = encodeURIComponent(params.id);
  const [booking, payment] = await Promise.all([
    initialUserResource(`/api/v1/user/bookings/${id}`),
    initialUserResource(`/api/v1/user/payment/status/${id}`),
  ]);
  return <BookingDetailsClient params={params} initialBooking={booking} initialPayment={payment}/>;
}
