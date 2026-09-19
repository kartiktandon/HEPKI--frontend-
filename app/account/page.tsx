import AccountClient from '@/components/AccountClient';
import { initialUserResource } from '@/lib/api/server';
export const metadata = { title: 'Your account' };
export default async function AccountPage() {
  const addresses = await initialUserResource('/api/v1/user/addresses');
  return <AccountClient initialAddresses={addresses}/>;
}
