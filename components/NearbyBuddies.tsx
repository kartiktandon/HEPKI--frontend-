'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSession } from './SessionProvider';
import { ErrorNotice } from './ApiState';
import { useResource, type InitialResource } from '@/lib/api/hooks';
import { id, list, record, safeImage, text } from '@/lib/api/models';

type Coordinates = { latitude: number; longitude: number; name: string; addressId?: string };

export default function NearbyBuddies({ initialAddresses }: { initialAddresses?: InitialResource }) {
  const { user, loading } = useSession();
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  const addresses = useResource(user ? '/api/v1/user/addresses' : null, 'user', 0, initialAddresses);
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
    if (
      !Array.isArray(coordinates) ||
      coordinates.length < 2 ||
      !Number.isFinite(Number(coordinates[0])) ||
      !Number.isFinite(Number(coordinates[1])) ||
      Math.abs(Number(coordinates[0])) > 180 ||
      Math.abs(Number(coordinates[1])) > 90
    ) {
      setLocation(null);
      setLocationError('This address has no usable GPS coordinates. Choose another address or use current location.');
      return;
    }
    setLocation({
      longitude: Number(coordinates[0]),
      latitude: Number(coordinates[1]),
      name: text(address?.nickname ?? address?.city, 'your saved address'),
      addressId: value,
    });
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationError('Your browser does not support automatic geolocation.');
      return;
    }
    setLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      position => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          name: 'Your Current Location',
        });
        setLocating(false);
      },
      () => {
        setLocationError('Could not access device location. Choose a saved address or allow location permissions.');
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }

  if (loading) {
    return (
      <div className="nearbyLoadingBox">
        <span className="spinner"></span>
        <p>Checking available Buddies in your area…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="discoveryPrompt">
        <div className="discoveryPromptContent">
          <div className="discoveryPromptIcon">📍</div>
          <div>
            <h3>Check Available Buddies Near You</h3>
            <p>Sign in to select your address and explore verified Buddies ready for dispatch in your neighborhood.</p>
          </div>
        </div>
        <div className="discoveryPromptActions">
          <Link className="primaryButton" href="/auth?next=%2F">
            Sign In to View <span className="btnArrow">→</span>
          </Link>
          <Link className="secondaryButton" href="/categories">
            Browse Services
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="nearbyContainer">
      {/* Control Bar */}
      <div className="nearbyToolbar">
        <div className="nearbySelectWrapper">
          <span className="toolbarIcon" aria-hidden="true">📍</span>
          <select
            value={location?.addressId ?? ''}
            onChange={e => (e.target.value ? chooseAddress(e.target.value) : setLocation(null))}
            className="nearbySelectInput"
          >
            <option value="">Select a saved address…</option>
            {options.map(address => (
              <option key={id(address)} value={id(address)}>
                {text(address.nickname ?? address.formattedAddress ?? address.city, 'Saved address')}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="locationGpsBtn"
          disabled={locating}
          onClick={useCurrentLocation}
        >
          <span className="gpsIcon">🎯</span>
          {locating ? 'Detecting GPS…' : 'Use Current Location'}
        </button>
      </div>

      <ErrorNotice message={addresses.error} retry={addresses.reload} />
      <ErrorNotice message={locationError} />

      {!location && (
        <div className="nearbyPromptBanner">
          <p>
            👉 <strong>Select an address above</strong> or use your current location to check real-time Buddy availability.{' '}
            <Link href="/account" className="textLink">Manage addresses →</Link>
          </p>
        </div>
      )}

      {location && (
        <div className="nearbyResultsSection">
          <div className="nearbyStatusHeader">
            <span className="activeRadarPill">
              <span className="radarPulse"></span> Active Radar
            </span>
            <p className="locationLabel">
              Showing Buddies near <strong>{location.name}</strong>. Availability is matched instantly upon booking.
            </p>
          </div>

          <ErrorNotice message={buddies.error} retry={buddies.reload} />

          {buddies.loading && (
            <div className="nearbyLoadingBox">
              <span className="spinner"></span>
              <p>Scanning nearby verified Buddies…</p>
            </div>
          )}

          {!buddies.loading && !buddies.error && (
            items.length ? (
              <div className="nearbyGrid">
                {items.slice(0, 4).map((item, index) => {
                  const buddy = record(item.provider ?? item.buddy ?? item.providerId ?? item);
                  const profile = record(buddy.profile);
                  const buddyId = id(buddy) || id(item.providerId);
                  const name = text(buddy.fullName ?? profile.fullName ?? buddy.name ?? item.fullName, 'Verified Buddy');
                  const city = text(buddy.baseCity ?? buddy.city, 'Near your location');

                  return (
                    <article className="nearbyCard" key={buddyId || index}>
                      <div className="nearbyAvatarWrap">
                        <img
                          src={safeImage(buddy.profileImage ?? profile.profileImage ?? buddy.avatar, '/assets/default-buddy-avatar.jpg')}
                          alt={name}
                          loading="lazy"
                          decoding="async"
                          width={64}
                          height={64}
                        />
                        <span className="onlineStatusDot" title="Ready for dispatch"></span>
                      </div>

                      <div className="nearbyInfo">
                        <div className="nearbyHeaderRow">
                          <strong>{name}</strong>
                          <span className="verifiedShield">✓ Verified</span>
                        </div>
                        <span className="nearbyCity">📍 {city}</span>
                        <div className="nearbyRatingRow">
                          <span className="starBadge">★ 4.9</span>
                          <span className="ratingCount">Highly Rated</span>
                        </div>
                      </div>

                      <div className="nearbyActions">
                        <Link href="/book" className="nearbyBookBtn">
                          Book Buddy
                        </Link>
                        {buddyId && (
                          <Link href={`/buddy/${encodeURIComponent(buddyId)}`} className="nearbyReviewLink">
                            Reviews →
                          </Link>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="nearbyEmptyBox">
                <span className="nearbyEmptyIcon">🔍</span>
                <h4>No Buddies currently online in this specific radius</h4>
                <p>Don’t worry! You can still pre-book or schedule any service, and we will assign a verified Buddy in advance.</p>
                <Link href="/book" className="primaryButton small">
                  Pre-Book Service <span className="btnArrow">→</span>
                </Link>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
