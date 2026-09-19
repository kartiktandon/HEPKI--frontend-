import { api } from './client';
import { record, text, unwrap } from './models';
type Result = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type Checkout = { open: () => void; on: (event: string, callback: (value: unknown) => void) => void };
declare global { interface Window { Razorpay?: new (options: Record<string, unknown>) => Checkout } }
let loading: Promise<void> | undefined;
function loadCheckout() {
  if (window.Razorpay) return Promise.resolve();
  if (!loading) loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'; script.async = true;
    const timer = setTimeout(() => { script.remove(); reject(new Error('Payment checkout timed out. Try again.')); }, 20000);
    script.onload = () => { clearTimeout(timer); window.Razorpay ? resolve() : reject(new Error('Payment checkout is unavailable.')); };
    script.onerror = () => { clearTimeout(timer); script.remove(); reject(new Error('Could not load payment checkout. Check your connection.')); };
    document.head.appendChild(script);
  }).catch(error => { loading = undefined; throw error; });
  return loading;
}
export async function payBooking(bookingId: string) {
  await loadCheckout();
  const order = record(unwrap(await api('/api/v1/user/payment/create-order', { method: 'POST', role: 'user', body: { bookingId, paymentMethod: 'online' } })));
  if (!text(order.keyId) || !text(order.orderId) || typeof order.amount !== 'number' || order.amount <= 0) throw new Error('The payment service did not return a valid order. Your booking is saved in My Bookings.');
  const result = await new Promise<Result>((resolve, reject) => {
    const checkout = new window.Razorpay!({ key: order.keyId, order_id: order.orderId, amount: order.amount, currency: text(order.currency, 'INR'), name: 'Hepki',
      description: 'Service booking', handler: resolve, modal: { ondismiss: () => reject(new Error('Checkout closed. Your booking is saved. Check payment status before trying again.')) } });
    checkout.on('payment.failed', value => reject(new Error(text(record(record(value).error).description, 'Payment failed. Check payment status before trying again.'))));
    checkout.open();
  });
  // A client callback is not proof of payment: only the backend can verify it.
  await api('/api/v1/user/payment/verify', { method: 'POST', role: 'user', body: { bookingId,
    razorpayOrderId: result.razorpay_order_id, razorpayPaymentId: result.razorpay_payment_id, razorpaySignature: result.razorpay_signature } });
}
