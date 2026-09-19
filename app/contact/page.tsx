'use client';
import Link from 'next/link';
import { useResource } from '@/lib/api/hooks';
import { record, text, unwrap } from '@/lib/api/models';
import { ErrorNotice } from '@/components/ApiState';
export default function ContactPage() {
  const resource = useResource('/api/v1/public/content/contact');
  const contact = record(record(unwrap(resource.data)).contact);
  const email = text(contact.email); const phone = text(contact.phone);
  return <section className="section pageTop"><div className="container contactGrid"><div><div className="sectionHeading"><span className="eyebrow">CONTACT</span><h1>How can we help?</h1><p>For a booking or payment issue, open your booking and select Get help.</p></div><Link className="primaryButton" href="/bookings">Get booking support</Link></div><div className="formCard"><h2>Contact information</h2>{resource.loading && <p role="status">Loading contact information…</p>}<ErrorNotice message={resource.error ? 'Contact information is currently unavailable.' : ''} retry={resource.reload}/>{email && <a href={`mailto:${encodeURIComponent(email)}`}>{email}</a>}{phone && <a href={`tel:${phone.replace(/[^+0-9]/g, '')}`}>{phone}</a>}{contact.address ? <p>{text(contact.address)}</p> : null}{!resource.loading && !email && !phone && <p>Please use booking support for help with an existing booking.</p>}</div></div></section>;
}
