'use client';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useSession } from '@/components/SessionProvider';
import { ErrorNotice, LoginNotice } from '@/components/ApiState';
import { api, errorMessage } from '@/lib/api/client';
import { useResource, type InitialResource } from '@/lib/api/hooks';
import { bookingDisplayStatus, bookingSchedule, dateLabel, id, label, money, record, text, unwrap } from '@/lib/api/models';
import { payBooking } from '@/lib/api/payment';
export default function BookingDetails({ params, initialBooking, initialPayment }: { params: { id: string }; initialBooking?: InitialResource; initialPayment?: InitialResource }) {
  const { user, loading } = useSession(); const path = `/api/v1/user/bookings/${encodeURIComponent(params.id)}`;
  const resource = useResource(user ? path : null, 'user', 15000, initialBooking);
  const paymentResource = useResource(user ? `/api/v1/user/payment/status/${encodeURIComponent(params.id)}` : null, 'user', 15000, initialPayment);
  const data = record(unwrap(resource.data)); const booking = record(data.booking ?? data);
  const paymentData = record(unwrap(paymentResource.data)); const payment = record(paymentData.payment ?? (paymentData.status ? paymentData : booking.payment));
  const provider = record(booking.providerId ?? booking.provider); const address = record(booking.addressId ?? booking.address);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [action, setAction] = useState('');
  const terminal = ['completed', 'cancelled_by_user', 'cancelled_by_provider', 'cancelled_by_admin', 'failed'].includes(text(booking.bookingStatus));
  async function run(work: () => Promise<void>) { if (busy) return; setBusy(true); setError(''); setMessage(''); try { await work(); resource.reload(); paymentResource.reload(); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); } }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const fields = Object.fromEntries(new FormData(event.currentTarget));
    await run(async () => {
      if (action === 'reschedule' && new Date(`${fields.scheduledDate}T${fields.timeSlot}`).getTime() <= Date.now()) throw new Error('Choose a future date and time.');
      await api(action === 'support' ? '/api/v1/user/disputes' : path + '/' + action, { method: 'POST', role: 'user', body: action === 'support' ? { ...fields, bookingId: params.id } : fields });
      setMessage(action === 'support' ? 'Your support request was submitted.' : 'Your booking has been updated.'); setAction('');
    });
  }
  async function invoice() {
    const blob = await api<Blob>(path + '/invoice', { role: 'user', blob: true });
    if (blob.type.includes('json')) {
      const payload = record(unwrap(JSON.parse(await blob.text()))); const url = text(payload.url ?? payload.invoiceUrl);
      if (!url.startsWith('https://')) throw new Error('An invoice download is not available yet.');
      const link = document.createElement('a'); link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.click();
    } else if (blob.type.includes('pdf')) { const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `invoice-${params.id}.pdf`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 10000); }
    else throw new Error('The service did not return a downloadable invoice.');
  }
  if (loading) {
    return (
      <section className="section pageTop">
        <div className="container narrow" style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--muted)', fontWeight: 600 }}>Checking your account…</p>
        </div>
      </section>
    );
  }
  const statusStr = bookingDisplayStatus(booking, payment);
  const schedule = bookingSchedule(booking);
  const scheduledDate = dateLabel(schedule.date, 'Schedule not available');
  const bookingNum = text(booking.bookingNumber ?? booking.bookingId, params.id);
  const serviceTitle = text(booking.serviceName ?? record(booking.serviceId).serviceName, 'Service booking');
  const fullAddr = text(address.formattedAddress) || [address.flatNumber, address.society, address.city].map(v => text(v)).filter(Boolean).join(', ') || 'Saved service address';

  return (
    <section className="section pageTop">
      <div className="container narrow">
        <div style={{ marginBottom: '16px' }}>
          <Link href="/bookings" className="textLink" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            &larr; Back to My Bookings
          </Link>
        </div>

        <div className="sectionHeading split">
          <div>
            <span className="bookingIdChip">#{bookingNum}</span>
            <h1 style={{ margin: '4px 0 8px' }}>{serviceTitle}</h1>
            <p>Scheduled for {scheduledDate}{schedule.time ? ` at ${schedule.time}` : ''}</p>
          </div>
          <div>
            <span className={`statusPill ${statusStr.toLowerCase()}`}>
              {label(statusStr)}
            </span>
          </div>
        </div>

        {!user ? (
          <LoginNotice next={`/bookings/${params.id}`} />
        ) : (
          <div className="stack">
            <ErrorNotice message={resource.error} retry={resource.reload} />

            <div className="summaryCard">
              <div className="summaryRow">
                <span>Booking ID</span>
                <strong>#{bookingNum}</strong>
              </div>
              <div className="summaryRow">
                <span>Service</span>
                <strong>{serviceTitle}</strong>
              </div>
              <div className="summaryRow">
                <span>Schedule</span>
                <strong>{scheduledDate}{schedule.time ? ` at ${schedule.time}` : ''}</strong>
              </div>
              <div className="summaryRow">
                <span>Payment</span>
                <strong>{label(payment.status)} &middot; {label(payment.method)}</strong>
              </div>
              <div className="summaryRow">
                <span>Address</span>
                <strong style={{ textAlign: 'right', maxWidth: '60%' }}>{fullAddr}</strong>
              </div>
              <div className="summaryRow totalRow">
                <span>Total Amount</span>
                <strong>{money(booking.totalAmount ?? record(booking.pricing).totalAmount ?? payment.amount)}</strong>
              </div>
            </div>

            {id(provider) && (
              <div className="formCard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div>
                  <span className="eyebrow">ASSIGNED BUDDY</span>
                  <h3 style={{ margin: '2px 0 4px' }}>{text(provider.fullName ?? provider.name, 'Assigned Buddy')}</h3>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>Verified Hepki Professional</p>
                </div>
                <Link className="secondaryButton small" href={`/buddy/${encodeURIComponent(id(provider))}`}>
                  View Buddy &rarr;
                </Link>
              </div>
            )}

            {(booking.startOtp !== undefined || booking.completionOtp !== undefined) && (
              <div className="otpBox">
                <div>
                  <strong style={{ fontSize: '15px', color: 'var(--ink)', display: 'block', marginBottom: '2px' }}>
                    Service Security Codes
                  </strong>
                  <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
                    Share these one-time codes with your Buddy during the visit.
                  </span>
                </div>
                <div className="otpGrid">
                  {booking.startOtp !== undefined && (
                    <div className="otpCard">
                      <div className="otpCardLabel">Start Code</div>
                      <div className="otpCardCode">{text(booking.startOtp)}</div>
                    </div>
                  )}
                  {booking.completionOtp !== undefined && (
                    <div className="otpCard">
                      <div className="otpCardLabel">Completion Code</div>
                      <div className="otpCardCode">{text(booking.completionOtp)}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
            <ErrorNotice message={error} />
            <ErrorNotice message={paymentResource.error} retry={paymentResource.reload} />
            {message && <p className="notice" role="status">{message}</p>}

            <p className="hint">
              Status refreshes automatically. Share your service code with your Buddy only when you are ready to start or confirm completion.
            </p>

            <div className="wizardActions" style={{ justifyContent: 'flex-start', flexWrap: 'wrap' }}>
              {!terminal && payment.method !== 'cod' && ['pending', 'failed'].includes(text(payment.status)) && (
                <button
                  type="button"
                  className="primaryButton"
                  disabled={busy || !!paymentResource.error || paymentResource.loading}
                  onClick={() => run(async () => {
                    const current = record(unwrap(await api(`/api/v1/user/payment/status/${encodeURIComponent(params.id)}`, { role: 'user' })));
                    if (record(current.payment ?? current).status === 'paid') {
                      setMessage('Your payment is already confirmed.');
                      return;
                    }
                    await payBooking(params.id);
                    setMessage('Payment verified.');
                  })}
                >
                  {busy ? 'Please wait…' : 'Pay with Razorpay'}
                </button>
              )}
              <button type="button" className="secondaryButton" disabled={busy} onClick={() => run(invoice)}>
                Download invoice
              </button>
              {!terminal && (
                <>
                  <button type="button" className="secondaryButton" disabled={busy} onClick={() => setAction('reschedule')}>
                    Reschedule
                  </button>
                  <button type="button" className="secondaryButton" disabled={busy} onClick={() => setAction('cancel')}>
                    Cancel booking
                  </button>
                </>
              )}
              <button type="button" className="secondaryButton" disabled={busy} onClick={() => setAction('support')}>
                Get help
              </button>
            </div>

            {action && (
              <form className="formCard" onSubmit={submit}>
                <fieldset disabled={busy}>
                  <h2>{action === 'cancel' ? 'Confirm cancellation' : action === 'support' ? 'Contact booking support' : 'Reschedule booking'}</h2>
                  {action === 'cancel' && (
                    <>
                      <p>The service may apply cancellation charges according to your booking terms.</p>
                      <label>
                        Reason
                        <textarea name="reason" required />
                      </label>
                    </>
                  )}
                  {action === 'reschedule' && (
                    <div className="formGrid">
                      <label>
                        Date
                        <input name="scheduledDate" required type="date" min={new Date().toLocaleDateString('en-CA')} />
                      </label>
                      <label>
                        Time
                        <input name="timeSlot" required type="time" />
                      </label>
                    </div>
                  )}
                  {action === 'support' && (
                    <>
                      <label>
                        Subject
                        <input name="subject" required />
                      </label>
                      <label>
                        Issue category
                        <input name="category" required placeholder="e.g. payment or service" />
                      </label>
                      <label>
                        Describe the issue
                        <textarea name="description" required rows={4} />
                      </label>
                    </>
                  )}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                    <button type="submit" className="primaryButton">
                      {busy ? 'Submitting…' : action === 'cancel' ? 'Confirm cancellation' : 'Submit'}
                    </button>
                    <button type="button" className="ghostButton" onClick={() => setAction('')}>
                      Close
                    </button>
                  </div>
                </fieldset>
              </form>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
