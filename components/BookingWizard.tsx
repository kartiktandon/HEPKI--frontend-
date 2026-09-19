'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { api, ApiError, errorMessage } from '@/lib/api/client';
import { useResource, type InitialResource } from '@/lib/api/hooks';
import { category, id, list, money, record, servicePrice, text, unwrap } from '@/lib/api/models';
import { payBooking } from '@/lib/api/payment';
import { useSession } from './SessionProvider';
import { ErrorNotice, LoginNotice } from './ApiState';
import AddressManager from './AddressManager';

const WIZARD_STEPS = [
  { id: 'service', label: 'Service' },
  { id: 'type', label: 'Booking Type' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'address', label: 'Address' },
  { id: 'review', label: 'Review & Pay' },
] as const;

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const BOOKING_TYPES = [
  {
    value: 'instant',
    title: 'On-the-Spot',
    icon: '⚡',
    badge: 'Fastest Match',
    badgeClass: 'badgeInstant',
    desc: 'Immediate dispatch. The nearest verified Buddy is matched directly to your address.',
  },
  {
    value: 'prebooked',
    title: 'Pre-Book',
    icon: '📅',
    badge: 'Flexible Slot',
    badgeClass: 'badgePrebook',
    desc: 'Schedule ahead for a specific date and time that fits your day perfectly.',
  },
  {
    value: 'monthly_session',
    title: 'Monthly Package',
    icon: '⭐',
    badge: 'Best Value',
    badgeClass: 'badgeMonthly',
    desc: 'Recurring sessions with a dedicated Buddy each week and bundled savings.',
  },
] as const;

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [createdId, setCreatedId] = useState('');
  const [uncertain, setUncertain] = useState(false);
  const [createdPackage, setCreatedPackage] = useState(false);
  const [message, setMessage] = useState('');
  const locked = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCategoryId(params.get('category') || '');
    const type = params.get('type');
    if (type === 'prebooked' || type === 'monthly_session' || type === 'instant') setBookingType(type);
  }, []);

  const catalog = useResource('/api/v1/user/services/categories', undefined, 0, initialCatalog);
  const services = useResource(categoryId ? `/api/v1/user/services/categories/${encodeURIComponent(categoryId)}/services` : null);
  const categories = list(catalog.data).map(category);
  const available = list(services.data, 'services');
  const service = available.find(s => id(s) === serviceId);
  const monthly = bookingType === 'monthly_session';

  const currentCategoryName = categories.find(c => c.id === categoryId)?.name;
  const currentRate = service ? servicePrice(service) : undefined;

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
      const body = monthly
        ? { categoryId, addressId, month, recurringDays: days, sessionTime: time, sessionDurationHours: hours, genderPreference: 'any' }
        : {
            serviceId,
            addressId,
            immediate: bookingType === 'instant',
            paymentMethod,
            ...(bookingType === 'prebooked' ? { scheduledDate: date, timeSlot: time } : {}),
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
          <h2>{createdPackage ? 'Monthly Package Saved!' : 'Booking Confirmed!'}</h2>
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
              <span style={{ color: 'var(--muted)' }}>Payment:</span>
              <strong style={{ color: 'var(--ink)' }}>{paymentMethod === 'online' ? 'Online (Paid / Pending)' : 'Cash on Delivery'}</strong>
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

            <label className="formLabel">
              Service Category
              <div className="selectWrapper">
                <select
                  className="styledSelect"
                  value={categoryId}
                  onChange={e => {
                    setCategoryId(e.target.value);
                    setServiceId('');
                  }}
                >
                  <option value="">Select a category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="selectArrow">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </label>

            <ErrorNotice message={services.error} retry={services.reload} />
            {services.loading && <p role="status">Loading available services…</p>}

            {categoryId && !services.loading && (
              <div style={{ marginTop: '10px' }}>
                <span className="sectionSubheading">Available Services</span>
                <div className="optionGrid">
                  {available.map(s => {
                    const isSelected = serviceId === id(s);
                    const sPrice = servicePrice(s);
                    const isHourly = s.pricingType === 'hourly';
                    const minHours = Number(s.minDurationHours || 1);

                    return (
                      <button
                        type="button"
                        key={id(s)}
                        className={`selectCard ${isSelected ? 'selected' : ''}`}
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

                        <p className="serviceCardDesc">{text(s.description)}</p>

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
                <p>No services are currently active in this category. Please select another category.</p>
              </div>
            )}
          </div>
        )}

        {/* STEP 1: Choose Booking Type */}
        {step === 1 && (
          <div className="stack">
            <div className="wizardStepHeader">
              <h2>Choose How You Want to Book</h2>
              <p>Select the booking model that best matches your timeline and requirements.</p>
            </div>

            <div className="optionGrid three">
              {BOOKING_TYPES.map(opt => {
                const isSelected = bookingType === opt.value;

                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`bookingTypeCard ${isSelected ? 'selected' : ''}`}
                    onClick={() => setBookingType(opt.value)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
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
              <div className="infoCalloutCard">
                <div className="infoCalloutIcon">⚡</div>
                <div className="infoCalloutContent">
                  <h4>Instant Buddy Matching Active</h4>
                  <p>
                    As soon as you review and confirm your booking, our system will immediately notify the closest verified Buddies in your area.
                  </p>
                  <div className="infoBulletRow">
                    <span className="infoBullet">✓ Real-time status in My Bookings</span>
                    <span className="infoBullet">✓ Direct contact with assigned Buddy</span>
                    <span className="infoBullet">✓ 100% Secure Payments</span>
                  </div>
                </div>
              </div>
            ) : (
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
                  Preferred Time Slot
                  <input
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                  />
                </label>
              </div>
            )}

            {monthly && (
              <div style={{ marginTop: '18px' }}>
                <label className="fieldHintLabel">
                  Hours per session (Min: {Number(service?.minDurationHours || 1)} hrs)
                  <input
                    type="number"
                    min={Number(service?.minDurationHours || 1)}
                    max="24"
                    value={hours}
                    onChange={e => setHours(Number(e.target.value))}
                    style={{ maxWidth: '240px' }}
                  />
                </label>

                <div style={{ marginTop: '16px' }}>
                  <span className="sectionSubheading" style={{ marginBottom: '8px' }}>
                    Recurring Weekly Days
                  </span>
                  <div className="daysPillGrid">
                    {DAY_NAMES.map((d, i) => {
                      const isChecked = days.includes(i);
                      return (
                        <button
                          key={d}
                          type="button"
                          className={`dayPillBtn ${isChecked ? 'active' : ''}`}
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
                  <span className="hint" style={{ fontSize: '13px', color: 'var(--muted)' }}>
                    Monthly packages are coordinated with dedicated professionals assigned for consistent support.
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

            {/* Summary Box */}
            <div className="reviewSummaryBox">
              <div className="reviewSummaryItem">
                <span className="reviewSummaryLabel">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {monthly ? 'Category / Package' : 'Service'}
                </span>
                <span className="reviewSummaryValue">
                  {monthly ? currentCategoryName : text(service?.serviceName)}
                </span>
              </div>

              <div className="reviewSummaryItem">
                <span className="reviewSummaryLabel">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Schedule
                </span>
                <span className="reviewSummaryValue">
                  {monthly
                    ? `${month} · ${time} (${days.map(d => DAY_NAMES[d]).join(', ')})`
                    : bookingType === 'instant'
                    ? '⚡ Instant Dispatch (Next Available)'
                    : `${date} at ${time}`}
                </span>
              </div>

              {selectedAddress && (
                <div className="reviewSummaryItem">
                  <span className="reviewSummaryLabel">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    Service Location
                  </span>
                  <span className="reviewSummaryValue" style={{ fontSize: '13.5px' }}>
                    {text(selectedAddress.nickname ?? selectedAddress.addressType, 'Saved Address')}
                    {selectedAddress.formattedAddress ? ` (${text(selectedAddress.formattedAddress).slice(0, 32)}…)` : ''}
                  </span>
                </div>
              )}

              <div className="reviewSummaryTotal">
                <span className="reviewSummaryTotalLabel">Service Rate</span>
                <span className="reviewSummaryTotalValue">
                  {money(currentRate)}
                  {service?.pricingType === 'hourly' ? '/hr' : ''}
                </span>
              </div>
            </div>

            {/* Secure Payment Guarantee Banner */}
            <div className="trustPaymentCard">
              <div className="trustPaymentIcon">🛡️</div>
              <div className="trustPaymentText">
                <strong>100% Secure & Protected:</strong> Your payment is processed securely via Razorpay with instant verification and guaranteed verified Buddies.
              </div>
            </div>

            {!monthly && (
              <>
                {/* Promo Code Input */}
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13.5px', fontWeight: 700 }}>
                  Promo code (optional)
                  <div className="promoInputGroup">
                    <span className="promoIcon">
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </span>
                    <input
                      className="promoInput"
                      value={promoCode}
                      onChange={e => setPromoCode(e.target.value)}
                      placeholder="Enter promo or coupon code"
                    />
                  </div>
                </label>

                {/* Payment Method Toggle Cards */}
                <div style={{ marginTop: '14px' }}>
                  <span className="sectionSubheading" style={{ marginBottom: '8px' }}>
                    Select Payment Method
                  </span>
                  <div className="paymentCardGrid">
                    <div
                      className={`paymentCard ${paymentMethod === 'online' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('online')}
                      role="button"
                      tabIndex={0}
                    >
                      <div>
                        <div className="paymentCardHeader">
                          <span className="paymentCardTitle">Online Payment</span>
                          <div className="selectIndicator">
                            {paymentMethod === 'online' && <CheckIcon />}
                          </div>
                        </div>
                        <p className="paymentCardDesc">Pay securely via Razorpay with UPI, Debit/Credit Card, or NetBanking.</p>
                      </div>
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
                    >
                      <div>
                        <div className="paymentCardHeader">
                          <span className="paymentCardTitle">Cash on Delivery</span>
                          <div className="selectIndicator">
                            {paymentMethod === 'cod' && <CheckIcon />}
                          </div>
                        </div>
                        <p className="paymentCardDesc">Pay in cash directly to your Buddy once the service has been completed.</p>
                      </div>
                      <div className="paymentBadges">
                        <span className="paymentMiniBadge">Cash</span>
                        <span className="paymentMiniBadge">Pay Later</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Confirm CTA */}
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
                    Confirm Booking & Open Checkout
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
