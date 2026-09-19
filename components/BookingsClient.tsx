'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useSession } from '@/components/SessionProvider';
import { ErrorNotice, LoginNotice } from '@/components/ApiState';
import { useResource, type InitialResource } from '@/lib/api/hooks';
import { dateLabel, id, label, list, record, text, unwrap } from '@/lib/api/models';
export default function BookingsPage({ initial }: { initial?: InitialResource }) {
  const { user, loading } = useSession(); const [page, setPage] = useState(1); const [tab, setTab] = useState('bookings');
  const resource = useResource(user ? `/api/v1/user/${tab}?page=${page}&limit=10` : null, 'user', 20000, initial);
  const items = list(resource.data, tab); const pagination = record(record(resource.data).pagination ?? record(unwrap(resource.data)).pagination);
  if (loading) return <section className="section"><div className="container">Checking your account…</div></section>;
  return <section className="section pageTop"><div className="container"><div className="sectionHeading"><span className="eyebrow">MY BOOKINGS</span><h1>Your bookings</h1><p>Track your services and monthly packages.</p></div>{!user ? <LoginNotice/> : <>
    <div className="tabRow"><button className={tab === 'bookings' ? 'active' : ''} onClick={() => { setTab('bookings'); setPage(1); }}>Bookings</button><button className={tab === 'packages' ? 'active' : ''} onClick={() => { setTab('packages'); setPage(1); }}>Monthly packages</button></div>
    <ErrorNotice message={resource.error} retry={resource.reload}/>{resource.loading && <p role="status">Loading…</p>}
    <div className="bookingTable">{items.map(item => <div className="bookingRow" key={id(item)}><div><small>{text(item.bookingNumber ?? item.bookingId, id(item))}</small><strong>{text(item.serviceName ?? record(item.serviceId).serviceName ?? record(item.categoryId).categoryName, tab === 'packages' ? 'Monthly package' : 'Service booking')}</strong></div><span>{dateLabel(item.scheduledDate ?? item.month)} {text(item.timeSlot)}</span><span className="statusPill">{label(item.bookingStatus ?? item.status)}</span>{tab === 'bookings' && <Link className="secondaryButton" href={`/bookings/${encodeURIComponent(id(item))}`}>View details</Link>}</div>)}</div>
    {!resource.loading && !resource.error && !items.length && <div className="emptyState"><p>No {tab} found.</p><Link className="primaryButton" href="/book">Book a service</Link></div>}
    <div className="wizardActions"><button className="secondaryButton" disabled={page === 1 || resource.loading} onClick={() => setPage(p => p - 1)}>Previous</button><span>Page {page}</span><button className="secondaryButton" disabled={resource.loading || (pagination.hasNext !== undefined ? !pagination.hasNext : items.length < 10)} onClick={() => setPage(p => p + 1)}>Next</button></div>
  </>}</div></section>;
}
