import { initialUserResource, serverGet } from '@/lib/api/server';
import NearbyBuddies from './NearbyBuddies';
import RecommendedServices from './RecommendedServices';

export async function ReadyNearYou() {
  const initialAddresses = await initialUserResource('/api/v1/user/addresses');
  return <NearbyBuddies initialAddresses={initialAddresses}/>;
}

export async function Recommendations() {
  const servicesPath = '/api/v1/user/services?limit=50';
  const [initialBookings, initialServices] = await Promise.all([
    initialUserResource('/api/v1/user/bookings?page=1&limit=20'),
    serverGet(servicesPath).then(data => ({ path: servicesPath, data })).catch(() => undefined),
  ]);
  return <RecommendedServices initialBookings={initialBookings} initialServices={initialServices}/>;
}
