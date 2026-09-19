'use client';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useSession } from '@/components/SessionProvider';
import { ErrorNotice, LoginNotice } from '@/components/ApiState';
import { api, errorMessage } from '@/lib/api/client';
import { useResource } from '@/lib/api/hooks';
import { dateLabel, id, label, money, record, text, unwrap } from '@/lib/api/models';
import { payBooking } from '@/lib/api/payment';
export default function BookingDetails({ params }: { params: { id: string } }) {
  const { user, loading } = useSession(); const path = `/api/v1/user/bookings/${encodeURIComponent(params.id)}`;
  const resource = useResource(user ? path : null, 'user', 15000);
  const paymentResource = useResource(user ? `/api/v1/user/payment/status/${encodeURIComponent(params.id)}` : null, 'user', 15000);
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
  if (loading) return <section className="section"><div className="container">Checking your account…</div></section>;
  return <section className="section pageTop"><div className="container narrow"><Link href="/bookings">← My Bookings</Link><h1>Booking details</h1>{!user ? <LoginNotice next={`/bookings/${params.id}`}/> : <>
    <ErrorNotice message={resource.error} retry={resource.reload}/>{resource.loading && <p role="status">Loading booking…</p>}
    {resource.data && <div className="stack"><div className="summaryCard"><div><span>Booking</span><strong>{text(booking.bookingNumber ?? booking.bookingId, params.id)}</strong></div><div><span>Status</span><strong>{label(booking.bookingStatus)}</strong></div><div><span>Service</span><strong>{text(booking.serviceName ?? record(booking.serviceId).serviceName, 'Service booking')}</strong></div><div><span>Schedule</span><strong>{dateLabel(booking.scheduledDate)} {text(booking.timeSlot)}</strong></div><div><span>Payment</span><strong>{label(payment.status)} · {label(payment.method)}</strong></div><div><span>Total</span><strong>{money(booking.totalAmount ?? record(booking.pricing).totalAmount ?? payment.amount)}</strong></div><div><span>Address</span><strong>{text(address.formattedAddress) || [address.flatNumber, address.society, address.city].map(v => text(v)).filter(Boolean).join(', ') || 'Saved service address'}</strong></div>
    {id(provider) && <div><span>Assigned Buddy</span><Link href={`/buddy/${encodeURIComponent(id(provider))}`}>{text(provider.fullName ?? provider.name, 'View Buddy')}</Link></div>}
    {booking.startOtp !== undefined && <div><span>Start code</span><strong>{text(booking.startOtp)}</strong></div>}{booking.completionOtp !== undefined && <div><span>Completion code</span><strong>{text(booking.completionOtp)}</strong></div>}</div>
    <ErrorNotice message={error}/><ErrorNotice message={paymentResource.error} retry={paymentResource.reload}/>{message && <p className="notice" role="status">{message}</p>}
    <p className="hint">Status refreshes every 15 seconds. Share a service code with your Buddy only when you are ready to start or confirm completion.</p>
    <div className="ctaRow">{!terminal && payment.method !== 'cod' && ['pending', 'failed'].includes(text(payment.status)) && <button className="primaryButton" disabled={busy || !!paymentResource.error || paymentResource.loading} onClick={() => run(async () => {
      const current = record(unwrap(await api(`/api/v1/user/payment/status/${encodeURIComponent(params.id)}`, { role: 'user' })));
      if (record(current.payment ?? current).status === 'paid') { setMessage('Your payment is already confirmed.'); return; }
      await payBooking(params.id); setMessage('Payment verified.');
    })}>{busy ? 'Please wait…' : 'Pay with Razorpay'}</button>}
    <button className="secondaryButton" disabled={busy} onClick={() => run(invoice)}>Download invoice</button>{!terminal && <><button className="secondaryButton" disabled={busy} onClick={() => setAction('reschedule')}>Reschedule</button><button className="secondaryButton" disabled={busy} onClick={() => setAction('cancel')}>Cancel booking</button></>}<button className="secondaryButton" disabled={busy} onClick={() => setAction('support')}>Get help</button></div>
    {action && <form className="formCard" onSubmit={submit}><fieldset disabled={busy}><h2>{action === 'cancel' ? 'Confirm cancellation' : action === 'support' ? 'Contact booking support' : 'Reschedule booking'}</h2>
      {action === 'cancel' && <><p>The service may apply cancellation charges according to your booking terms.</p><label>Reason<textarea name="reason" required/></label></>}
      {action === 'reschedule' && <div className="formGrid"><label>Date<input name="scheduledDate" required type="date" min={new Date().toLocaleDateString('en-CA')}/></label><label>Time<input name="timeSlot" required type="time"/></label></div>}
      {action === 'support' && <><label>Subject<input name="subject" required/></label><label>Issue category<input name="category" required placeholder="e.g. payment or service"/></label><label>Describe the issue<textarea name="description" required rows={5}/></label></>}
      <button className="primaryButton">{busy ? 'Submitting…' : action === 'cancel' ? 'Confirm cancellation' : 'Submit'}</button><button type="button" className="textLink" onClick={() => setAction('')}>Close</button></fieldset></form>}
    </div>}
  </>}</div></section>;
}
