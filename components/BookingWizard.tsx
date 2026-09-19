'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { api, ApiError, errorMessage } from '@/lib/api/client';
import { useResource } from '@/lib/api/hooks';
import { category, id, list, money, record, servicePrice, text, unwrap } from '@/lib/api/models';
import { payBooking } from '@/lib/api/payment';
import { useSession } from './SessionProvider';
import { ErrorNotice, LoginNotice } from './ApiState';
import AddressManager from './AddressManager';
const steps = ['Service', 'Booking type', 'Schedule', 'Address', 'Review'];
export default function BookingWizard() {
  const { loading, user } = useSession();
  const [step, setStep] = useState(0); const [categoryId, setCategoryId] = useState(''); const [serviceId, setServiceId] = useState('');
  const [bookingType, setBookingType] = useState('instant'); const [addressId, setAddressId] = useState('');
  const [date, setDate] = useState(''); const [time, setTime] = useState(''); const [month, setMonth] = useState('');
  const [days, setDays] = useState<number[]>([1, 3, 5]); const [hours, setHours] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('online'); const [promoCode, setPromoCode] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [createdId, setCreatedId] = useState('');
  const [uncertain, setUncertain] = useState(false);
  const [createdPackage, setCreatedPackage] = useState(false); const [message, setMessage] = useState(''); const locked = useRef(false);
  useEffect(() => { const params = new URLSearchParams(window.location.search); setCategoryId(params.get('category') || ''); const type = params.get('type'); if (type === 'prebooked' || type === 'monthly_session') setBookingType(type); }, []);
  const catalog = useResource('/api/v1/user/services/categories');
  const services = useResource(categoryId ? `/api/v1/user/services/categories/${encodeURIComponent(categoryId)}/services` : null);
  const categories = list(catalog.data).map(category); const available = list(services.data, 'services');
  const service = available.find(s => id(s) === serviceId); const allowed = record(service?.allowedBookingTypes);
  const monthly = bookingType === 'monthly_session';
  const supports = (type: string) => allowed[type === 'instant' ? 'onTheSpot' : type === 'prebooked' ? 'preBook' : 'monthlyPackage'] === true;
  function next() {
    setError('');
    if (step === 0 && !service) { setError('Choose a service to continue.'); return; }
    if (step === 1 && !supports(bookingType)) { setError('Choose an available booking type for this service.'); return; }
    if (step === 2 && monthly && (!month || month < new Date().toISOString().slice(0, 7) || !time || !days.length || !Number.isFinite(hours) || hours > 24 || hours < Number(service?.minDurationHours || 1))) { setError('Choose a month, session time, duration and at least one day.'); return; }
    if (step === 2 && bookingType === 'prebooked' && (!date || !time || new Date(`${date}T${time}`).getTime() <= Date.now())) { setError('Choose a future date and time.'); return; }
    if (step === 3 && !addressId) { setError('Choose a saved service address.'); return; }
    setStep(s => Math.min(4, s + 1));
  }
  async function book() {
    if (locked.current || createdId || !service) return;
    locked.current = true; setBusy(true); setError('');
    let saved = false;
    try {
      const body = monthly ? { categoryId, addressId, month, recurringDays: days, sessionTime: time, sessionDurationHours: hours, genderPreference: 'any' }
        : { serviceId, addressId, immediate: bookingType === 'instant', paymentMethod, ...(bookingType === 'prebooked' ? { scheduledDate: date, timeSlot: time } : {}), ...(promoCode.trim() ? { promoCode: promoCode.trim() } : {}) };
      const result = record(unwrap(await api(monthly ? '/api/v1/user/packages' : '/api/v1/user/bookings', { method: 'POST', body, role: 'user' })));
      const newId = id(result.booking ?? result.package ?? result) || text(result.bookingId ?? result.packageId);
      // Do not permit another create after a successful response, even if the ID contract differs.
      saved = true; setCreatedId(newId || 'saved'); setCreatedPackage(monthly);
      if (monthly) { setMessage('Your package request was saved. View My Bookings for its current status.'); return; }
      if (!newId) { setMessage('Your booking was saved. Open My Bookings to view its details and payment status.'); return; }
      if (paymentMethod === 'online') { setMessage('Booking saved. Complete checkout to pay.'); await payBooking(newId); setMessage('Payment verified. We’re finding a Buddy for your booking.'); }
      else setMessage('Your booking was saved with cash payment. Track its status in My Bookings.');
    } catch (e) { setError(errorMessage(e)); if (!saved && e instanceof ApiError && (e.status === 0 || e.status >= 500)) setUncertain(true); }
    finally { locked.current = false; setBusy(false); }
  }
  if (loading) return <p role="status">Checking your account…</p>;
  if (!user) return <LoginNotice next={`/book${categoryId ? `?category=${encodeURIComponent(categoryId)}&type=${bookingType}` : `?type=${bookingType}`}`}/>;
  if (uncertain) return <div className="formCard"><h2>Check your bookings</h2><ErrorNotice message={error}/><p>We couldn’t confirm whether the request was saved. Check My Bookings before creating another booking.</p><Link className="primaryButton" href="/bookings">My Bookings</Link></div>;
  if (createdId) return <div className="formCard"><h2>{createdPackage ? 'Package saved' : 'Booking saved'}</h2><p role="status">{message}</p><ErrorNotice message={error}/><p>Check your booking’s current status before making another payment.</p><Link className="primaryButton" href={createdPackage || createdId === 'saved' ? '/bookings' : `/bookings/${encodeURIComponent(createdId)}`}>View {createdPackage ? 'packages' : 'booking'}</Link></div>;
  return <div className="wizardShell"><div className="stepper">{steps.map((s, i) => <div className={`step ${i <= step ? 'active' : ''}`} key={s}><span>{i + 1}</span><em>{s}</em></div>)}</div><div className="wizardPanel"><ErrorNotice message={error}/>
    {step === 0 && <div className="stack"><h2>Choose a service</h2><ErrorNotice message={catalog.error} retry={catalog.reload}/>{catalog.loading && <p role="status">Loading categories…</p>}<label>Category<select value={categoryId} onChange={e => { setCategoryId(e.target.value); setServiceId(''); }}><option value="">Select a category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <ErrorNotice message={services.error} retry={services.reload}/>{services.loading && <p role="status">Loading services…</p>}<div className="optionGrid">{available.map(s => <button type="button" key={id(s)} className={`selectCard ${serviceId === id(s) ? 'selected' : ''}`} onClick={() => { setServiceId(id(s)); setHours(Number(s.minDurationHours || 1)); }}><strong>{text(s.serviceName, 'Service')}</strong><span>{text(s.description)}</span><span>{money(servicePrice(s))}{s.pricingType === 'hourly' ? '/hr' : ''}</span></button>)}</div>{categoryId && !services.loading && !services.error && !available.length && <p>No services are currently available in this category.</p>}</div>}
    {step === 1 && <><h2>Choose booking type</h2><div className="optionGrid three">{[['instant', 'On-the-Spot'], ['prebooked', 'Pre-Book'], ['monthly_session', 'Monthly Package']].map(([value, title]) => <button key={value} type="button" disabled={!supports(value)} className={`selectCard ${bookingType === value ? 'selected' : ''}`} onClick={() => setBookingType(value)}><strong>{title}</strong><span>{supports(value) ? 'Available' : 'Not available for this service'}</span></button>)}</div></>}
    {step === 2 && <div className="stack"><h2>{monthly ? 'Plan your monthly sessions' : 'Choose your schedule'}</h2>{bookingType === 'instant' ? <p>We’ll search for an available Buddy after your booking is confirmed.</p> : <div className="formGrid">{monthly ? <label>Month<input type="month" min={new Date().toISOString().slice(0, 7)} value={month} onChange={e => setMonth(e.target.value)}/></label> : <label>Date<input type="date" min={new Date().toLocaleDateString('en-CA')} value={date} onChange={e => setDate(e.target.value)}/></label>}<label>Time<input type="time" value={time} onChange={e => setTime(e.target.value)}/></label></div>}
      {monthly && <><label>Hours per session<input type="number" min={Number(service?.minDurationHours || 1)} max="24" value={hours} onChange={e => setHours(Number(e.target.value))}/></label><div className="chips">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => <label className="checkLabel" key={d}><input type="checkbox" checked={days.includes(i)} onChange={e => setDays(e.target.checked ? [...days, i].sort() : days.filter(day => day !== i))}/>{d}</label>)}</div><p>Monthly packages are arranged by category. The backend determines the assigned professional and package total.</p></>}
    </div>}
    {step === 3 && <><h2>Where do you need help?</h2><AddressManager selected={addressId} onSelect={setAddressId}/></>}
    {step === 4 && <div className="stack"><h2>Review your booking</h2><div className="summaryCard"><div><span>{monthly ? 'Category' : 'Service'}</span><strong>{monthly ? categories.find(c => c.id === categoryId)?.name : text(service?.serviceName)}</strong></div><div><span>Schedule</span><strong>{monthly ? `${month} · ${time}` : bookingType === 'instant' ? 'Next available' : `${date} · ${time}`}</strong></div><div><span>Service rate</span><strong>{money(servicePrice(service || {}))}{service?.pricingType === 'hourly' ? '/hr' : ''}</strong></div></div><p className="hint">Final pricing and taxes are calculated by the service. A Buddy is assigned automatically; availability is confirmed after booking.</p>
      {!monthly && <><label>Promo code (optional)<input value={promoCode} onChange={e => setPromoCode(e.target.value)}/></label><label>Payment method<select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}><option value="online">Online — Razorpay</option><option value="cod">Cash on delivery</option></select></label></>}
      <button type="button" className="primaryButton full" disabled={busy} onClick={book}>{busy ? 'Saving your booking…' : monthly ? 'Create monthly package' : paymentMethod === 'online' ? 'Create booking & open checkout' : 'Confirm cash booking'}</button></div>}
    <div className="wizardActions"><button type="button" disabled={step === 0 || busy} className="secondaryButton" onClick={() => { setError(''); setStep(s => s - 1); }}>Back</button>{step < 4 && <button type="button" className="primaryButton" onClick={next}>Continue</button>}</div>
  </div></div>;
}
