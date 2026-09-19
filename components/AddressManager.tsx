'use client';
import { FormEvent, useState } from 'react';
import { api, errorMessage } from '@/lib/api/client';
import { id, list, record, text, unwrap } from '@/lib/api/models';
import { useResource, type InitialResource } from '@/lib/api/hooks';
import { ErrorNotice } from './ApiState';

export default function AddressManager({
  selected,
  onSelect,
  initial
}: {
  selected?: string;
  onSelect?: (id: string, address?: Record<string, unknown>) => void;
  initial?: InitialResource;
}) {
  const resource = useResource('/api/v1/user/addresses', 'user', 0, initial);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const addresses = list(resource.data, 'addresses');

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const result = record(unwrap(await api('/api/v1/user/addresses', {
        method: 'POST',
        role: 'user',
        body: {
          ...fields,
          isDefault: addresses.length === 0,
          location: { type: 'Point', coordinates: [Number(longitude), Number(latitude)] },
        }
      })));
      const created = id(result.address ?? result);
      const createdObj = record(result.address ?? result);
      if (created) onSelect?.(created, createdObj);
      setAdding(false);
      resource.reload();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function locate() {
    setError('');
    if (!navigator.geolocation) {
      setError('Your browser does not support automatic location. Enter coordinates manually.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      p => {
        setLatitude(String(p.coords.latitude));
        setLongitude(String(p.coords.longitude));
        setLocating(false);
      },
      () => {
        setError('Could not access current location. Please allow location permissions or enter coordinates.');
        setLocating(false);
      },
      { timeout: 10000 }
    );
  }

  return (
    <div className="stack">
      <ErrorNotice message={resource.error} retry={resource.reload} />
      <ErrorNotice message={error} />

      {resource.loading ? (
        <p role="status">Loading saved addresses…</p>
      ) : (
        <div className="addressCardList">
          {addresses.map(address => {
            const addrId = id(address);
            const isSelected = selected === addrId;
            const fullStr = text(address.formattedAddress) || [address.flatNumber, address.society, address.city].map(v => text(v)).filter(Boolean).join(', ');
            const addrType = text(address.addressType, 'home').toLowerCase();

            return (
              <div
                key={addrId}
                className={`addressSelectCard ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelect?.(addrId, address)}
                role={onSelect ? 'button' : undefined}
                tabIndex={onSelect ? 0 : undefined}
                onKeyDown={e => {
                  if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onSelect(addrId, address);
                  }
                }}
              >
                <div className="addressCardLeft">
                  <div className="addressCardIcon">
                    {addrType === 'work' ? (
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="addressCardDetails">
                    <strong>
                      {text(address.nickname ?? address.addressType, 'Service Address')}
                      {Boolean(address.addressType) && <span className="addressBadge badgeType">{text(address.addressType)}</span>}
                      {address.isDefault === true && <span className="addressBadge badgeDefault">Default</span>}
                    </strong>
                    <p>{fullStr}</p>
                    {Boolean(address.contactName) && (
                      <p style={{ fontSize: '12px', color: '#718096', marginTop: '3px' }}>
                        Contact: {text(address.contactName)} {address.contactPhone ? `(${text(address.contactPhone)})` : ''}
                      </p>
                    )}
                  </div>
                </div>

                {onSelect && (
                  <div className="selectIndicator" style={{ marginLeft: '12px' }}>
                    {isSelected && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!resource.loading && !addresses.length && !adding && (
        <div style={{ textAlign: 'center', padding: '24px 16px', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
          <p style={{ margin: '0 0 12px', color: 'var(--muted)', fontSize: '14.5px' }}>
            No saved addresses found. Please add the address where you need assistance.
          </p>
          <button type="button" className="primaryButton" onClick={() => setAdding(true)}>
            + Add First Address
          </button>
        </div>
      )}

      {addresses.length > 0 && (
        <button
          type="button"
          className="secondaryButton"
          style={{ width: 'fit-content', alignSelf: 'flex-start' }}
          onClick={() => setAdding(v => !v)}
        >
          {adding ? 'Cancel adding address' : '+ Add a new address'}
        </button>
      )}

      {adding && (
        <form className="formCard" onSubmit={save} style={{ marginTop: '12px' }}>
          <fieldset disabled={busy} style={{ border: 0, padding: 0, margin: 0 }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 14px' }}>
              Add New Service Address
            </h3>

            <div className="formGrid">
              <label>
                Address label
                <input name="nickname" required placeholder="e.g. Home, Office, Parents' House" />
              </label>
              <label>
                Address type
                <select name="addressType">
                  <option value="home">Home</option>
                  <option value="work">Work</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label>
                Contact person name
                <input name="contactName" required autoComplete="name" placeholder="Full name" />
              </label>
              <label>
                Contact phone
                <input name="contactPhone" type="tel" required autoComplete="tel" placeholder="10-digit mobile number" />
              </label>
              <label>
                Flat / Door / House number
                <input name="flatNumber" required placeholder="e.g. Flat 402, Tower B" />
              </label>
              <label>
                Building / Society / Street
                <input name="society" required placeholder="e.g. Greenwood Apartments, 5th Cross" />
              </label>
              <label>
                City
                <input name="city" required autoComplete="address-level2" placeholder="e.g. Bangalore" />
              </label>
              <label>
                Landmark (optional)
                <input name="landmark" placeholder="e.g. Near Metro Station / Park" />
              </label>
            </div>

            <label style={{ marginTop: '14px' }}>
              Full address
              <textarea name="formattedAddress" required autoComplete="street-address" placeholder="Complete address including area, pincode and city" rows={3} />
            </label>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px', marginTop: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <strong style={{ fontSize: '13.5px', color: 'var(--ink)', display: 'block' }}>Map Coordinates</strong>
                  <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>Used by our dispatch engine to assign the closest Buddy.</span>
                </div>
                <button type="button" className="secondaryButton" onClick={locate} disabled={locating} style={{ padding: '8px 14px', fontSize: '13px' }}>
                  {locating ? 'Detecting location…' : '📍 Auto-detect My Location'}
                </button>
              </div>

              <div className="formGrid">
                <label>
                  Latitude
                  <input type="number" step="any" required min="-90" max="90" value={latitude} onChange={e => setLatitude(e.target.value)} placeholder="e.g. 12.9716" />
                </label>
                <label>
                  Longitude
                  <input type="number" step="any" required min="-180" max="180" value={longitude} onChange={e => setLongitude(e.target.value)} placeholder="e.g. 77.5946" />
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button type="submit" className="primaryButton" disabled={busy}>
                {busy ? 'Saving address…' : 'Save & Select Address'}
              </button>
              <button type="button" className="ghostButton" onClick={() => setAdding(false)}>
                Cancel
              </button>
            </div>
          </fieldset>
        </form>
      )}
    </div>
  );
}
