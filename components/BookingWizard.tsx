'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { api, ApiError, errorMessage } from '@/lib/api/client';
import { useResource, type InitialResource } from '@/lib/api/hooks';
import { category, dateLabel, id, list, money, record, servicePrice, text, unwrap } from '@/lib/api/models';
import { payBooking } from '@/lib/api/payment';
import { useSession } from './SessionProvider';
import { ErrorNotice, LoginNotice } from './ApiState';
import AddressManager from './AddressManager';

const WIZARD_STEPS = [
  { id: 'service', label: 'Service', icon: '🛠️' },
  { id: 'type', label: 'Booking Type', icon: '⚡' },
  { id: 'schedule', label: 'Schedule', icon: '📅' },
  { id: 'address', label: 'Address', icon: '📍' },
  { id: 'review', label: 'Review & Pay', icon: '💳' },
] as const;

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const BOOKING_TYPES = [
  {
    value: 'instant',
    title: 'On-the-Spot Dispatch',
    icon: '⚡',
    badge: 'Fastest Match',
    badgeClass: 'badgeInstant',
    desc: 'Immediate dispatch. The closest verified Buddy in your neighborhood is assigned directly to your address.',
    highlight: 'Matched within minutes',
  },
  {
    value: 'prebooked',
    title: 'Schedule Ahead',
    icon: '📅',
    badge: 'Flexible Slot',
    badgeClass: 'badgePrebook',
    desc: 'Pick your preferred date and time slot in advance. Guaranteed Buddy arrival on time.',
    highlight: 'Custom date & time',
  },
  {
    value: 'monthly_session',
    title: 'Monthly Package',
    icon: '⭐',
    badge: 'Best Value',
    badgeClass: 'badgeMonthly',
    desc: 'Recurring sessions with a dedicated Buddy each week and bundled savings for ongoing assistance.',
    highlight: 'Save up to 20%',
  },
] as const;

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function CategoryIcon({ name }: { name: string }) {
  const l = (name || '').toLowerCase();
  if (l.includes('hosp') || l.includes('medic') || l.includes('companion')) return <span>🏥</span>;
  if (l.includes('shop') || l.includes('grocer') || l.includes('errand')) return <span>🛒</span>;
  if (l.includes('gym') || l.includes('fit') || l.includes('workout')) return <span>💪</span>;
  if (l.includes('pet') || l.includes('dog') || l.includes('cat')) return <span>🐾</span>;
  if (l.includes('event') || l.includes('party')) return <span>🎉</span>;
  if (l.includes('overnight') || l.includes('stay')) return <span>🌙</span>;
  return <span>🤝</span>;
}

export default function BookingWizard({ initialCatalog }: { initialCatalog?: InitialResource }) {
  const { loading, user } = useSession();
  const [step, setStep] = useState(0);
  const [categoryId, setCategoryId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [bookingType, setBookingType] = useState('instant');
  const [addressId, setAddressId] = useState('');
  const [selectedAddress, setSelectedAddress] = useState<Record<string, unknown> | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [month, setMonth] = useState('');
  const [days, setDays] = useState<number[]>([1, 3, 5]);
  const [hours, setHours] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoMessage, setPromoMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [createdId, setCreatedId] = useState('');
  const [uncertain, setUncertain] = useState(false);
  const [createdPackage, setCreatedPackage] = useState(false);
  const [onlinePaymentVerified, setOnlinePaymentVerified] = useState(false);
  const [message, setMessage] = useState('');
  const locked = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('category');
    if (cat) setCategoryId(cat);
    const svc = params.get('service');
    if (svc) setServiceId(svc);
    const type = params.get('type');
    if (type === 'prebooked' || type === 'monthly_session' || type === 'instant') setBookingType(type);
  }, []);

  const catalog = useResource('/api/v1/user/services/categories', undefined, 0, initialCatalog);
  const services = useResource(categoryId ? `/api/v1/user/services/categories/${encodeURIComponent(categoryId)}/services` : null);
  const categories = list(catalog.data).map(category);
  const available = list(services.data, 'services');
  const service = available.find(s => id(s) === serviceId);
  const monthly = bookingType === 'monthly_session';

  const currentCategory = categories.find(c => c.id === categoryId);
  const currentCategoryName = currentCategory?.name || 'Selected Category';
  const currentRate = service ? servicePrice(service) : undefined;

  // Auto-select single service if only 1 is available
  useEffect(() => {
    if (available.length === 1 && !serviceId) {
      const single = available[0];
      setServiceId(id(single));
      setHours(Number(single.minDurationHours || 1));
    }
  }, [available, serviceId]);

  // Quick Date presets
  function setQuickDate(offsetDays: number) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setDate(`${y}-${m}-${day}`);
  }

  function applyPromo() {
    if (!promoCode.trim()) {
      setPromoMessage('');
      setPromoApplied(false);
      return;
    }
    setPromoApplied(true);
    setPromoMessage(`Coupon "${promoCode.trim().toUpperCase()}" applied!`);
  }

  function next() {
    setError('');
    if (step === 0 && !service) {
      setError('Please select a service to proceed.');
      return;
    }
    if (step === 1 && !bookingType) {
      setError('Please choose a booking type to proceed.');
      return;
    }
    if (step === 2 && monthly && (!month || month < new Date().toISOString().slice(0, 7) || !time || !days.length || !Number.isFinite(hours) || hours > 24 || hours < Number(service?.minDurationHours || 1))) {
      setError('Please choose a valid month, session time, session duration and at least one recurring day.');
      return;
    }
    if (step === 2 && bookingType === 'prebooked' && (!date || !time || new Date(`${date}T${time}`).getTime() <= Date.now())) {
      setError('Please choose a future date and time for your booking.');
      return;
    }
    if (step === 3 && !addressId) {
      setError('Please select or add a service address to continue.');
      return;
    }
    setStep(s => Math.min(4, s + 1));
  }

  async function book() {
    if (locked.current || createdId || !service) return;
    locked.current = true;
    setBusy(true);
    setError('');
    let saved = false;
    try {
      const now = new Date();
      const year = now.getFullYear();
      const monthStr = String(now.getMonth() + 1).padStart(2, '0');
      const dayStr = String(now.getDate()).padStart(2, '0');
      const todayDate = `${year}-${monthStr}-${dayStr}`;

      const hoursStr = String(now.getHours()).padStart(2, '0');
      const minutesStr = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${hoursStr}:${minutesStr}`;

      const scheduledDate = bookingType === 'prebooked' && date ? date : todayDate;
      const timeSlot = bookingType === 'prebooked' && time ? time : currentTime;

      const body = monthly
        ? { categoryId, addressId, month, recurringDays: days, sessionTime: time, sessionDurationHours: hours, genderPreference: 'any' }
        : {
            serviceId,
            addressId,
            immediate: bookingType === 'instant',
            scheduledDate,
            timeSlot,
            paymentMethod,
            ...(promoCode.trim() ? { promoCode: promoCode.trim() } : {}),
          };

      const result = record(unwrap(await api(monthly ? '/api/v1/user/packages' : '/api/v1/user/bookings', {
        method: 'POST',
        body,
        role: 'user',
      })));

      const newId = id(result.booking ?? result.package ?? result) || text(result.bookingId ?? result.packageId);
      saved = true;
      setCreatedId(newId || 'saved');
      setCreatedPackage(monthly);

      if (monthly) {
        setMessage('Your package request has been submitted successfully. View My Bookings to track confirmation.');
        return;
      }
      if (!newId) {
        setMessage('Your booking was saved successfully. Open My Bookings to view details and payment status.');
        return;
      }
      if (paymentMethod === 'online') {
        setMessage('Booking initialized. Opening secure checkout…');
        await payBooking(newId);
        setOnlinePaymentVerified(true);
        setMessage('Payment verified! We are matching you with the nearest verified Buddy.');
      } else {
        setMessage('Your cash booking has been confirmed! Track its live status in My Bookings.');
      }
    } catch (e) {
      setError(errorMessage(e));
      if (!saved && e instanceof ApiError && (e.status === 0 || e.status >= 500)) {
        setUncertain(true);
      }
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p role="status" style={{ color: 'var(--muted)', fontSize: '15px' }}>Checking your account…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginNotice
        next={`/book${categoryId ? `?category=${encodeURIComponent(categoryId)}&type=${bookingType}` : `?type=${bookingType}`}`}
      />
    );
  }

  if (uncertain) {
    return (
      <div className="formCard" style={{ textAlign: 'center', padding: '44px 28px' }}>
        <div className="successIconBadge" style={{ background: '#fffbeb', borderColor: '#fde68a', color: '#d97706' }}>
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2>Booking Status Verification</h2>
        <ErrorNotice message={error} />
        <p style={{ color: 'var(--muted)', fontSize: '15px', maxWidth: '500px', margin: '0 auto 24px' }}>
          We could not immediately verify if your booking was completed. Please review your bookings dashboard before attempting another payment to avoid duplicate charges.
        </p>
        <Link className="primaryButton" href="/bookings">
          Check My Bookings
        </Link>
      </div>
    );
  }

  if (createdId) {
    return (
      <div className="wizardShell">
        <div className="bookingSuccessCard">
          <div className="successIconBadge">
            <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2>
            {createdPackage
              ? 'Monthly Package Saved!'
              : paymentMethod === 'online' && !onlinePaymentVerified
                ? 'Payment Pending'
                : 'Booking Confirmed!'}
          </h2>
          <p role="status">{message}</p>
          <ErrorNotice message={error} />

          <div className="successCardSummary">
            <div className="successSummaryRow">
              <span style={{ color: 'var(--muted)' }}>Service:</span>
              <strong style={{ color: 'var(--ink)' }}>{monthly ? currentCategoryName : text(service?.serviceName)}</strong>
            </div>
            <div className="successSummaryRow">
              <span style={{ color: 'var(--muted)' }}>Type:</span>
              <span style={{ fontWeight: 700, color: 'var(--blue)' }}>
                {bookingType === 'instant' ? '⚡ On-the-Spot' : bookingType === 'prebooked' ? '📅 Scheduled' : '⭐ Monthly Package'}
              </span>
            </div>
            <div className="successSummaryRow">
              <span style={{ color: 'var(--muted)' }}>Schedule:</span>
              <strong style={{ color: 'var(--ink)' }}>
                {monthly
                  ? `${month} · ${time} (${days.map(day => DAY_NAMES[day]).join(', ')})`
                  : bookingType === 'instant'
                    ? 'Immediate dispatch'
                    : `${dateLabel(date, 'Date not available')} at ${time}`}
              </strong>
            </div>
            <div className="successSummaryRow">
              <span style={{ color: 'var(--muted)' }}>Payment:</span>
              <strong style={{ color: 'var(--ink)' }}>
                {paymentMethod === 'online'
                  ? onlinePaymentVerified ? 'Online (Paid)' : 'Online (Pending)'
                  : 'Cash on Delivery'}
              </strong>
            </div>
          </div>

          <div className="bookingSuccessActions">
            <Link
              className="primaryButton"
              href={createdPackage || createdId === 'saved' ? '/bookings' : `/bookings/${encodeURIComponent(createdId)}`}
            >
              View {createdPackage ? 'Package' : 'Booking Details'}
            </Link>
            <Link className="secondaryButton" href="/">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wizardShell">
      {/* Desktop Stepper */}
      <div className="stepperContainer" aria-label="Booking steps">
        <div className="stepperTrack">
          <div className="stepperProgress" style={{ width: `${(step / (WIZARD_STEPS.length - 1)) * 100}%` }} />
        </div>
        <ul className="stepperList">
          {WIZARD_STEPS.map((s, i) => {
            const isCurrent = i === step;
            const isCompleted = i < step;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  className={`stepNode ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''}`}
                  onClick={() => {
                    if (isCompleted) {
                      setError('');
                      setStep(i);
                    }
                  }}
                  disabled={!isCompleted}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <div className="stepNodeCircle">
                    {isCompleted ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span className="stepNodeLabel">{s.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Mobile Stepper */}
      <div className="stepperMobile">
        <div className="stepperMobileHeader">
          <span className="stepperMobilePill">Step {step + 1} of 5</span>
          <span className="stepperMobileTitle">{WIZARD_STEPS[step].label}</span>
        </div>
        <div className="stepperMobileProgressBar">
          <div
            className="stepperMobileProgressFill"
            style={{ width: `${((step + 1) / WIZARD_STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="wizardPanel">
        <ErrorNotice message={error} />

        {/* STEP 0: Select Service */}
        {step === 0 && (
          <div className="stack">
            <div className="wizardStepHeader">
              <h2>Select Your Service</h2>
              <p>Choose the category and service you need help with.</p>
            </div>

            <ErrorNotice message={catalog.error} retry={catalog.reload} />
            {catalog.loading && <p role="status">Loading categories…</p>}

            {/* Category Dropdown */}
            <div className="categorySelectionSection">
              <label htmlFor="bookingCategorySelect" className="sectionSubheading" style={{ display: 'block', marginBottom: '8px' }}>
                Service Category
              </label>
              <div className="selectWrapper">
                <select
                  id="bookingCategorySelect"
                  className="styledSelect"
                  value={categoryId}
                  onChange={e => {
                    setCategoryId(e.target.value);
                    setServiceId('');
                  }}
                  aria-label="Choose a service category"
                >
                  <option value="">Choose a category…</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="selectArrow" aria-hidden="true">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <ErrorNotice message={services.error} retry={services.reload} />

            {/* Loading Skeleton */}
            {services.loading && (
              <div className="serviceSkeletonGrid">
                {[1, 2].map(k => (
                  <div key={k} className="serviceSkeletonCard">
                    <div className="skeletonLine title" />
                    <div className="skeletonLine desc" />
                    <div className="skeletonLine foot" />
                  </div>
                ))}
              </div>
            )}

            {/* Available Services List */}
            {categoryId && !services.loading && (
              <div style={{ marginTop: '16px' }}>
                <div className="serviceHeadingRow">
                  <span className="sectionSubheading">Available Services</span>
                  <span className="serviceCountBadge">{available.length} {available.length === 1 ? 'service' : 'services'}</span>
                </div>

                <div className="serviceBookingGrid">
                  {available.map(s => {
                    const isSelected = serviceId === id(s);
                    const sPrice = servicePrice(s);
                    const isHourly = s.pricingType === 'hourly';
                    const minHours = Number(s.minDurationHours || 1);

                    return (
                      <button
                        type="button"
                        key={id(s)}
                        className={`serviceSelectCard ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          setServiceId(id(s));
                          setHours(minHours);
                        }}
                      >
                        <div className="serviceCardTop">
                          <span className="serviceCardTitle">{text(s.serviceName, 'Service')}</span>
                          <span className="servicePriceBadge">
                            {money(sPrice)}{isHourly ? '/hr' : ''}
                          </span>
                        </div>

                        <p className="serviceCardDesc">{text(s.description, 'Reliable, verified Buddy support tailored to your schedule.')}</p>

                        <div className="serviceCardFooter">
                          <span className="serviceDurationPill">
                            ⏱️ Min. {minHours} {minHours > 1 ? 'hours' : 'hour'}
                          </span>
                          <div className="selectIndicator">
                            {isSelected && <CheckIcon />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {categoryId && !services.loading && !services.error && !available.length && (
              <div className="emptyNoticeCard">
                <p>No services are currently active in <strong>{currentCategoryName}</strong>.</p>
                <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>Please select another category above to continue.</p>
              </div>
            )}
          </div>
        )}

        {/* STEP 1: Choose Booking Type */}
        {step === 1 && (
          <div className="stack">
            <div className="wizardStepHeader">
              <h2>Choose How You Want to Book</h2>
              <p>Select the dispatch model that best matches your timeline and routine.</p>
            </div>

            <div className="bookingTypeGrid">
              {BOOKING_TYPES.map(opt => {
                const isSelected = bookingType === opt.value;

                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`bookingTypeCard ${isSelected ? 'selected' : ''}`}
                    onClick={() => setBookingType(opt.value)}
                  >
                    <div className="bookingTypeCardTop">
                      <div className="bookingTypeIconBox">{opt.icon}</div>
                      <div className="selectIndicator">
                        {isSelected && <CheckIcon />}
                      </div>
                    </div>

                    <span className={`bookingTypeBadge ${opt.badgeClass}`}>
                      {opt.badge}
                    </span>

                    <span className="bookingTypeTitle">{opt.title}</span>
                    <p className="bookingTypeDesc">{opt.desc}</p>

                    <div className="bookingTypeHighlight">
                      <span>✓ {opt.highlight}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: Schedule & Time */}
        {step === 2 && (
          <div className="stack">
            <div className="wizardStepHeader">
              <h2>{monthly ? 'Configure Your Monthly Sessions' : bookingType === 'instant' ? 'Instant Match Dispatch' : 'Choose Your Schedule'}</h2>
              <p>
                {monthly
                  ? 'Pick the starting month, session duration, and recurring days of the week.'
                  : bookingType === 'instant'
                  ? 'Immediate matching begins automatically once you confirm your booking.'
                  : 'Select your preferred appointment date and arrival time.'}
              </p>
            </div>

            {bookingType === 'instant' ? (
              <div className="instantMatchCard">
                <div className="instantMatchHeader">
                  <div className="instantMatchIconPulse">
                    <span className="instantMatchIcon">⚡</span>
                    <span className="instantMatchPulseRing" />
                  </div>
                  <div className="instantMatchTitleCol">
                    <div className="instantMatchBadgeRow">
                      <span className="instantStatusPill">Live Dispatch Ready</span>
                      <span className="instantEtaPill">⚡ Match within minutes</span>
                    </div>
                    <h3>Instant Buddy Matching Active</h3>
                  </div>
                </div>

                <p className="instantMatchDesc">
                  As soon as you review and confirm your booking, our matching engine automatically alerts verified, background-checked Buddies nearest to your location.
                </p>

                <div className="instantFeaturesList">
                  <div className="instantFeatureItem">
                    <div className="instantFeatureIcon">
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <strong>Live GPS & Arrival Tracking</strong>
                      <span>Follow status in real time in My Bookings</span>
                    </div>
                  </div>

                  <div className="instantFeatureItem">
                    <div className="instantFeatureIcon">
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div>
                      <strong>Direct In-App Contact</strong>
                      <span>Coordinate directly with your matched Buddy</span>
                    </div>
                  </div>

                  <div className="instantFeatureItem">
                    <div className="instantFeatureIcon">
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <strong>100% Verified Buddies</strong>
                      <span>Government ID & background verification guaranteed</span>
                    </div>
                  </div>
                </div>

                <div className="instantMatchFooter">
                  <span className="instantMatchFooterHint">
                    💡 Click <strong>Continue</strong> to select your address and complete your request.
                  </span>
                </div>
              </div>
            ) : (
              <div className="scheduleBox">
                {bookingType === 'prebooked' && (
                  <div className="quickDatePresets">
                    <span className="quickDateLabel">Quick Date:</span>
                    <button type="button" className="quickDateBtn" onClick={() => setQuickDate(0)}>Today</button>
                    <button type="button" className="quickDateBtn" onClick={() => setQuickDate(1)}>Tomorrow</button>
                    <button type="button" className="quickDateBtn" onClick={() => setQuickDate(2)}>In 2 Days</button>
                  </div>
                )}

                <div className="formGrid">
                  {monthly ? (
                    <label>
                      Starting Month
                      <input
                        type="month"
                        min={new Date().toISOString().slice(0, 7)}
                        value={month}
                        onChange={e => setMonth(e.target.value)}
                      />
                    </label>
                  ) : (
                    <label>
                      Preferred Date
                      <input
                        type="date"
                        min={new Date().toLocaleDateString('en-CA')}
                        value={date}
                        onChange={e => setDate(e.target.value)}
                      />
                    </label>
                  )}

                  <label>
                    Preferred Arrival Time
                    <input
                      type="time"
                      value={time}
                      onChange={e => setTime(e.target.value)}
                    />
                  </label>
                </div>
              </div>
            )}

            {monthly && (
              <div className="monthlyConfigBox">
                <div className="durationCounterRow">
                  <span className="counterLabel">
                    Hours per session (Min: {Number(service?.minDurationHours || 1)} hrs)
                  </span>
                  <div className="stepperBtnGroup">
                    <button
                      type="button"
                      className="counterBtn"
                      onClick={() => setHours(h => Math.max(Number(service?.minDurationHours || 1), h - 1))}
                      disabled={hours <= Number(service?.minDurationHours || 1)}
                    >
                      −
                    </button>
                    <span className="counterVal">{hours} hr{hours > 1 ? 's' : ''}</span>
                    <button
                      type="button"
                      className="counterBtn"
                      onClick={() => setHours(h => Math.min(24, h + 1))}
                      disabled={hours >= 24}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: '18px' }}>
                  <span className="sectionSubheading" style={{ marginBottom: '8px' }}>
                    Recurring Weekly Days
                  </span>
                  <div className="dayPicker">
                    {DAY_NAMES.map((d, i) => {
                      const isChecked = days.includes(i);
                      return (
                        <button
                          key={d}
                          type="button"
                          className={`dayPill ${isChecked ? 'active' : ''}`}
                          onClick={() => {
                            if (isChecked) {
                              setDays(days.filter(day => day !== i));
                            } else {
                              setDays([...days, i].sort());
                            }
                          }}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                  <span className="hint">
                    Monthly packages assign dedicated, background-checked professionals for ongoing weekly support.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Address Selection */}
        {step === 3 && (
          <div className="stack">
            <div className="wizardStepHeader">
              <h2>Where Should Your Buddy Arrive?</h2>
              <p>Select your service address so we can dispatch a Buddy near your exact location.</p>
            </div>
            <AddressManager
              selected={addressId}
              onSelect={(id, addr) => {
                setAddressId(id);
                if (addr) setSelectedAddress(addr);
              }}
            />
          </div>
        )}

        {/* STEP 4: Review & Payment */}
        {step === 4 && (
          <div className="stack">
            <div className="wizardStepHeader">
              <h2>Review Your Booking</h2>
              <p>Review the details below and select your preferred payment method.</p>
            </div>

            {/* Comprehensive Order Summary Card */}
            <div className="summaryCard">
              <div className="summaryRow">
                <span className="summaryLabel">
                  <CategoryIcon name={currentCategoryName} />
                  Service
                </span>
                <span className="summaryVal">
                  <strong>{monthly ? currentCategoryName : text(service?.serviceName)}</strong>
                  <span className="summarySubtext">{currentCategoryName}</span>
                </span>
              </div>

              <div className="summaryRow">
                <span className="summaryLabel">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Booking Type
                </span>
                <span className="bookingTypeChip">
                  {monthly ? '⭐ Monthly Package' : bookingType === 'instant' ? '⚡ Instant Dispatch' : '📅 Pre-Booked Slot'}
                </span>
              </div>

              <div className="summaryRow">
                <span className="summaryLabel">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Schedule
                </span>
                <span className="summaryVal">
                  {monthly
                    ? `${month} · ${time} (${days.map(d => DAY_NAMES[d]).join(', ')})`
                    : bookingType === 'instant'
                    ? '⚡ Immediate Dispatch (Next Available)'
                    : `${dateLabel(date, 'Date not available')} at ${time}`}
                </span>
              </div>

              {selectedAddress && (
                <div className="summaryRow">
                  <span className="summaryLabel">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    Service Location
                  </span>
                  <span className="summaryVal">
                    <strong>{text(selectedAddress.nickname ?? selectedAddress.addressType, 'Saved Address')}</strong>
                    {selectedAddress.formattedAddress ? <span className="summarySubtext">{text(selectedAddress.formattedAddress)}</span> : null}
                  </span>
                </div>
              )}

              <div className="summaryRow totalRow">
                <span className="totalLabel">Service Rate</span>
                <span className="totalVal">
                  {money(currentRate)}
                  {service?.pricingType === 'hourly' ? '/hr' : ''}
                </span>
              </div>
            </div>

            {/* Trust & Guarantee Banner */}
            <div className="trustBannerCard">
              <div className="trustBannerIcon">🛡️</div>
              <div className="trustBannerText">
                <strong>100% Safe & Guaranteed:</strong> Verified background-checked Buddies, instant cancellation before dispatch, and Razorpay secure payment processing.
              </div>
            </div>

            {!monthly && (
              <>
                {/* Promo Code Box */}
                <div className="promoBox">
                  <span className="promoLabel">Promo code (optional)</span>
                  <div className="promoInputGroup">
                    <span className="promoIcon" aria-hidden="true">🏷️</span>
                    <input
                      className="promoInput"
                      value={promoCode}
                      onChange={e => setPromoCode(e.target.value)}
                      placeholder="Enter coupon code (e.g. HEPKI50)"
                    />
                    <button type="button" className="promoApplyBtn" onClick={applyPromo}>
                      Apply
                    </button>
                  </div>
                  {promoMessage && (
                    <span className={`promoFeedback ${promoApplied ? 'success' : ''}`}>
                      {promoMessage}
                    </span>
                  )}
                </div>

                {/* Payment Method Cards */}
                <div style={{ marginTop: '16px' }}>
                  <span className="sectionSubheading" style={{ marginBottom: '10px' }}>
                    Select Payment Method
                  </span>
                  <div className="paymentGrid">
                    <div
                      className={`paymentCard ${paymentMethod === 'online' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('online')}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') setPaymentMethod('online');
                      }}
                    >
                      <div className="paymentCardHeader">
                        <span className="paymentCardTitle">💳 Online Payment</span>
                        <div className="selectIndicator">
                          {paymentMethod === 'online' && <CheckIcon />}
                        </div>
                      </div>
                      <p className="paymentCardDesc">Pay securely via Razorpay with UPI (GPay/PhonePe), Debit/Credit Card, or NetBanking.</p>
                      <div className="paymentBadges">
                        <span className="paymentMiniBadge">UPI</span>
                        <span className="paymentMiniBadge">Cards</span>
                        <span className="paymentMiniBadge">NetBanking</span>
                      </div>
                    </div>

                    <div
                      className={`paymentCard ${paymentMethod === 'cod' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('cod')}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') setPaymentMethod('cod');
                      }}
                    >
                      <div className="paymentCardHeader">
                        <span className="paymentCardTitle">💵 Cash on Delivery</span>
                        <div className="selectIndicator">
                          {paymentMethod === 'cod' && <CheckIcon />}
                        </div>
                      </div>
                      <p className="paymentCardDesc">Pay in cash directly to your Buddy once the service has been completed at your doorstep.</p>
                      <div className="paymentBadges">
                        <span className="paymentMiniBadge">Cash</span>
                        <span className="paymentMiniBadge">Pay Later</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Confirm CTA Button */}
            <button
              type="button"
              className="primaryButton full checkoutBtn"
              disabled={busy}
              onClick={book}
            >
              <span className="btnIcon">
                {busy ? (
                  'Saving your booking…'
                ) : monthly ? (
                  'Confirm & Create Monthly Package'
                ) : paymentMethod === 'online' ? (
                  <>
                    <LockIcon />
                    Confirm Booking & Pay {money(currentRate)}
                  </>
                ) : (
                  'Confirm Booking (Cash on Delivery)'
                )}
              </span>
            </button>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        <div className="wizardActions">
          <button
            type="button"
            disabled={step === 0 || busy}
            className="secondaryButton"
            onClick={() => {
              setError('');
              setStep(s => s - 1);
            }}
          >
            <span className="btnIcon">
              <ArrowLeftIcon />
              Back
            </span>
          </button>

          <span className="wizardStepCounter">Step {step + 1} of 5</span>

          {step < 4 && (
            <button type="button" className="primaryButton" onClick={next}>
              <span className="btnIcon">
                Continue
                <ArrowRightIcon />
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
