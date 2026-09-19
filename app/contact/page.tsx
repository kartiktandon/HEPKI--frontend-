import Link from 'next/link';
import { serverGet } from '@/lib/api/server';
import { record, text, unwrap } from '@/lib/api/models';
import ServerReadError from '@/components/ServerReadError';
export default async function ContactPage() {
  let payload: unknown;
  let failed = false;
  try { payload = await serverGet('/api/v1/public/content/contact'); } catch { failed = true; }
  const contact = record(record(unwrap(payload)).contact);
  const email = text(contact.email); const phone = text(contact.phone);
  return <section className="section pageTop"><div className="container contactGrid"><div><div className="sectionHeading"><span className="eyebrow">CONTACT</span><h1>How can we help?</h1><p>For a booking or payment issue, open your booking and select Get help.</p></div><Link className="primaryButton" href="/bookings">Get booking support</Link></div><div className="formCard"><h2>Contact information</h2>{failed && <ServerReadError message="Contact information is currently unavailable."/>}{email && <a href={`mailto:${encodeURIComponent(email)}`}>{email}</a>}{phone && <a href={`tel:${phone.replace(/[^+0-9]/g, '')}`}>{phone}</a>}{contact.address ? <p>{text(contact.address)}</p> : null}{!email && !phone && <p>Please use booking support for help with an existing booking.</p>}</div></div></section>;
}
