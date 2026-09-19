'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSession } from './SessionProvider';
import { ErrorNotice } from './ApiState';
import { useResource } from '@/lib/api/hooks';
import { id, list, record, safeImage, text } from '@/lib/api/models';

type Coordinates = { latitude: number; longitude: number; name: string; addressId?: string };
export default function NearbyBuddies() {
  const { user, loading } = useSession();
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const addresses = useResource(user ? '/api/v1/user/addresses' : null, 'user');
  const path = location ? `/api/v1/user/buddies?lat=${location.latitude}&lng=${location.longitude}` : null;
  const buddies = useResource(user ? path : null, 'user');
  const saved = list(addresses.data, 'addresses');
  const options = saved.length ? saved : list(addresses.data);
  const nearby = list(buddies.data, 'buddies');
  const providers = list(buddies.data, 'providers');
  const items = nearby.length ? nearby : providers.length ? providers : list(buddies.data);
  function chooseAddress(value: string) {
    setLocationError('');
    const address = options.find(item => id(item) === value);
    const coordinates = record(address?.location).coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2 || !Number.isFinite(Number(coordinates[0])) || !Number.isFinite(Number(coordinates[1])) || Math.abs(Number(coordinates[0])) > 180 || Math.abs(Number(coordinates[1])) > 90) {
      setLocation(null); setLocationError('This address has no usable location. Choose another address or use your current location.'); return;
    }
    setLocation({ longitude: Number(coordinates[0]), latitude: Number(coordinates[1]), name: text(address?.nickname ?? address?.city, 'your saved address'), addressId: value });
  }
  function useCurrentLocation() {
    if (!navigator.geolocation) { setLocationError('Your browser does not support location.'); return; }
    setLocating(true); setLocationError('');
    navigator.geolocation.getCurrentPosition(
      position => { setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude, name: 'your current location' }); setLocating(false); },
      () => { setLocationError('Could not access your location. Choose a saved address or allow location access.'); setLocating(false); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }
  if (loading) return <p role="status">Checking your account…</p>;
  if (!user) return <div className="discoveryPrompt"><p>Log in to see available Buddies near your service address.</p><Link className="secondaryButton" href="/auth?next=%2F">Log in</Link></div>;
  return <div className="stack">
    <div className="nearbyControls">
      <label>Service location<select value={location?.addressId ?? ''} onChange={event => event.target.value ? chooseAddress(event.target.value) : setLocation(null)}>
        <option value="">Choose a saved address</option>{options.map(address => <option key={id(address)} value={id(address)}>{text(address.nickname ?? address.formattedAddress ?? address.city, 'Saved address')}</option>)}
      </select></label>
      <button type="button" className="secondaryButton" disabled={locating} onClick={useCurrentLocation}>{locating ? 'Finding location…' : 'Use current location'}</button>
    </div>
    <ErrorNotice message={addresses.error} retry={addresses.reload}/><ErrorNotice message={locationError}/>
    {!location && <p className="hint">Choose a saved address or share your location to check local availability. <Link href="/account">Manage addresses →</Link></p>}
    {location && <><p className="hint">Showing Buddies near {location.name}. Availability is confirmed during booking.</p><ErrorNotice message={buddies.error} retry={buddies.reload}/>{buddies.loading && <p role="status">Finding available Buddies…</p>}
      {!buddies.loading && !buddies.error && (items.length ? <div className="nearbyGrid">{items.slice(0, 4).map((item, index) => { const buddy = record(item.provider ?? item.buddy ?? item.providerId ?? item); const profile = record(buddy.profile); const buddyId = id(buddy) || id(item.providerId); return <article className="nearbyCard" key={buddyId || index}>
        <img src={safeImage(buddy.profileImage ?? profile.profileImage ?? buddy.avatar, '/assets/default-buddy-avatar.jpg')} alt="" width="56" height="56"/>
        <div><strong>{text(buddy.fullName ?? profile.fullName ?? buddy.name ?? item.fullName, 'Available Buddy')}</strong><span>{text(buddy.baseCity ?? buddy.city, 'Near your location')}</span></div>
        {buddyId && <Link href={`/buddy/${encodeURIComponent(buddyId)}`}>View reviews →</Link>}
      </article>; })}</div> : <p className="emptyState">No Buddies are available near this location right now. Try another address or check back later.</p>)}
    </>}
  </div>;
}
