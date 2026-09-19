import { initialUserResource, serverGet } from '@/lib/api/server';
import { recommendationCategory } from '@/lib/api/models';
import NearbyBuddies from './NearbyBuddies';
import RecommendedServices from './RecommendedServices';

export async function ReadyNearYou() {
  const initialAddresses = await initialUserResource('/api/v1/user/addresses');
  return <NearbyBuddies initialAddresses={initialAddresses}/>;
}

export async function Recommendations() {
  const initialBookings = await initialUserResource('/api/v1/user/bookings?page=1&limit=10');
  const categoryId = recommendationCategory(initialBookings?.data);
  const path = categoryId ? `/api/v1/user/services?categoryId=${encodeURIComponent(categoryId)}` : undefined;
  const initialServices = path
    ? await serverGet(path).then(data => ({ path, data })).catch(() => undefined)
    : undefined;
  return <RecommendedServices initialBookings={initialBookings} initialServices={initialServices}/>;
}
