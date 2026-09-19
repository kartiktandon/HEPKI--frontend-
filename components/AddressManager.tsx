'use client';
import { FormEvent, useState } from 'react';
import { api, errorMessage } from '@/lib/api/client';
import { id, list, record, text, unwrap } from '@/lib/api/models';
import { useResource } from '@/lib/api/hooks';
import { ErrorNotice } from './ApiState';
export default function AddressManager({ selected, onSelect }: { selected?: string; onSelect?: (id: string) => void }) {
  const resource = useResource('/api/v1/user/addresses', 'user');
  const [adding, setAdding] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [latitude, setLatitude] = useState(''); const [longitude, setLongitude] = useState('');
  const addresses = list(resource.data, 'addresses');
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return; setBusy(true); setError('');
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const result = record(unwrap(await api('/api/v1/user/addresses', { method: 'POST', role: 'user', body: {
        ...fields, isDefault: addresses.length === 0, location: { type: 'Point', coordinates: [Number(longitude), Number(latitude)] },
      } })));
      const created = id(result.address ?? result);
      if (created) onSelect?.(created);
      setAdding(false); resource.reload();
    } catch (e) { setError(errorMessage(e)); }
    finally { setBusy(false); }
  }
  async function locate() {
    setError('');
    if (!navigator.geolocation) { setError('Your browser does not support location. Enter coordinates manually.'); return; }
    navigator.geolocation.getCurrentPosition(p => { setLatitude(String(p.coords.latitude)); setLongitude(String(p.coords.longitude)); }, () => setError('Could not get your location. Enable location access or enter coordinates manually.'), { timeout: 10000 });
  }
  return <div className="stack"><ErrorNotice message={resource.error} retry={resource.reload}/><ErrorNotice message={error}/>
    {resource.loading ? <p role="status">Loading addresses…</p> : <div className="optionGrid">{addresses.map(address => <div className={`selectCard ${selected === id(address) ? 'selected' : ''}`} key={id(address)}>
      <strong>{text(address.nickname ?? address.addressType, 'Address')}</strong><p>{text(address.formattedAddress) || [address.flatNumber, address.society, address.city].map(v => text(v)).filter(Boolean).join(', ')}</p>
      {onSelect && <button type="button" className="secondaryButton" onClick={() => onSelect(id(address))}>{selected === id(address) ? 'Selected' : 'Use this address'}</button>}
      {address.isDefault === true && <span>Default address</span>}
    </div>)}</div>}
    {!resource.loading && !addresses.length && <p>No saved addresses yet. Add your service address below.</p>}
    <button type="button" className="textLink" onClick={() => setAdding(v => !v)}>{adding ? 'Close address form' : '+ Add an address'}</button>
    {adding && <form className="formCard" onSubmit={save}><fieldset disabled={busy}><h3>New service address</h3><div className="formGrid">
      <label>Label<input name="nickname" required placeholder="Home / Office"/></label><label>Address type<select name="addressType"><option value="home">Home</option><option value="work">Work</option><option value="other">Other</option></select></label>
      <label>Contact name<input name="contactName" required autoComplete="name"/></label><label>Contact phone<input name="contactPhone" type="tel" required autoComplete="tel"/></label>
      <label>Flat / house number<input name="flatNumber" required/></label><label>Building / society<input name="society" required/></label><label>City<input name="city" required autoComplete="address-level2"/></label><label>Landmark<input name="landmark"/></label>
    </div><label>Full address<textarea name="formattedAddress" required autoComplete="street-address"/></label>
    <p className="hint">The location is used to find a Buddy near your service address. Use your current location only if you are at that address.</p>
    <button type="button" className="secondaryButton" onClick={locate}>Use my current location</button>
    <div className="formGrid"><label>Latitude<input type="number" step="any" required min="-90" max="90" value={latitude} onChange={e => setLatitude(e.target.value)}/></label><label>Longitude<input type="number" step="any" required min="-180" max="180" value={longitude} onChange={e => setLongitude(e.target.value)}/></label></div>
    <button className="primaryButton">{busy ? 'Saving…' : 'Save address'}</button></fieldset></form>}
  </div>;
}
