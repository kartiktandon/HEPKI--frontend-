'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useSession } from '@/components/SessionProvider';
import { ErrorNotice, LoginNotice } from '@/components/ApiState';
import { useResource, type InitialResource } from '@/lib/api/hooks';
import { dateLabel, id, label, list, record, text, unwrap } from '@/lib/api/models';
export default function BookingsPage({ initial }: { initial?: InitialResource }) {
  const { user, loading } = useSession();
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<'bookings' | 'packages'>('bookings');
  const resource = useResource(user ? `/api/v1/user/${tab}?page=${page}&limit=10` : null, 'user', 20000, initial);
  const items = list(resource.data, tab);
  const pagination = record(record(resource.data).pagination ?? record(unwrap(resource.data)).pagination);

  if (loading) {
    return (
      <section className="section pageTop">
        <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--muted)', fontWeight: 600 }}>Checking your account…</p>
        </div>
      </section>
    );
  }

  return (
    <section className="section pageTop">
      <div className="container">
        <div className="sectionHeading split">
          <div>
            <span className="eyebrow">MY BOOKINGS</span>
            <h1>Your Bookings &amp; Plans</h1>
            <p>Track your scheduled services, ongoing visits, and monthly subscriptions.</p>
          </div>
          {user && (
            <Link className="primaryButton" href="/categories">
              + Book New Service
            </Link>
          )}
        </div>
        {!user ? <LoginNotice next="/bookings" /> : (
          <div className="stack">
            <div className="segmentedTabs">
              <button type="button" className={`segmentedTab ${tab === 'bookings' ? 'active' : ''}`} onClick={() => { setTab('bookings'); setPage(1); }}>Service Bookings</button>
              <button type="button" className={`segmentedTab ${tab === 'packages' ? 'active' : ''}`} onClick={() => { setTab('packages'); setPage(1); }}>Monthly Packages</button>
            </div>
            <ErrorNotice message={resource.error} retry={resource.reload} />

            {resource.loading && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div className="spinner" style={{ margin: '0 auto 14px' }} />
                <p style={{ color: 'var(--muted)' }}>Loading {tab}…</p>
              </div>
            )}

            {!resource.loading && items.length > 0 && (
              <div className="bookingTable">
                {items.map(item => {
                  const itemId = id(item);
                  const statusVal = text(item.bookingStatus ?? item.status);
                  const bookingNum = text(item.bookingNumber ?? item.bookingId, itemId);
                  const title = text(
                    item.serviceName ?? record(item.serviceId).serviceName ?? record(item.categoryId).categoryName,
                    tab === 'packages' ? 'Monthly Care Package' : 'Home Service Booking'
                  );
                  const dateStr = dateLabel(item.scheduledDate ?? item.month);
                  const timeStr = text(item.timeSlot);

                  return (
                    <div className="bookingRowCard" key={itemId}>
                      <div>
                        <span className="bookingIdChip">#{bookingNum}</span>
                        <h3 className="bookingTitle">{title}</h3>
                      </div>
                      <div className="bookingMetaGroup">
                        <span><strong>Date:</strong> {dateStr || 'Flexible schedule'}</span>
                        {timeStr && <span><strong>Time:</strong> {timeStr}</span>}
                      </div>
                      <div>
                        <span className={`statusPill ${statusVal.toLowerCase()}`}>
                          {label(statusVal)}
                        </span>
                      </div>
                      <div>
                        {tab === 'bookings' ? (
                          <Link className="secondaryButton small" href={`/bookings/${encodeURIComponent(itemId)}`}>
                            View details &rarr;
                          </Link>
                        ) : (
                          <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 600 }}>Active package</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!resource.loading && !resource.error && !items.length && (
              <div className="emptyState">
                <div style={{ fontSize: '36px', marginBottom: '4px' }}>📋</div>
                <h2>No {tab === 'bookings' ? 'active bookings' : 'monthly packages'} found</h2>
                <p>
                  {tab === 'bookings'
                    ? 'You have no scheduled or past bookings yet. Find a trusted Buddy today!'
                    : 'Subscribe to recurring monthly services like cooking, cleaning, or companion visits.'}
                </p>
                <Link className="primaryButton" href="/categories" style={{ marginTop: '12px' }}>
                  Explore Services
                </Link>
              </div>
            )}

            {items.length > 0 && (
              <div className="wizardActions">
                <button
                  type="button"
                  className="secondaryButton small"
                  disabled={page === 1 || resource.loading}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  &larr; Previous
                </button>
                <span className="wizardStepCounter">Page {page}</span>
                <button
                  type="button"
                  className="secondaryButton small"
                  disabled={resource.loading || (pagination.hasNext !== undefined ? !pagination.hasNext : items.length < 10)}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next &rarr;
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
