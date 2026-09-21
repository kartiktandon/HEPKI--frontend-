import Link from 'next/link';
import { serverGet } from '@/lib/api/server';
import { id, list, record, safeImage, text, unwrap } from '@/lib/api/models';
import ServerReadError from '@/components/ServerReadError';

export default async function BuddyPage({ params }: { params: { id: string } }) {
  let payload: unknown;
  try {
    payload = await serverGet(`/api/v1/user/ratings/provider/${encodeURIComponent(params.id)}?page=1&limit=20`);
  } catch (error) {
    return (
      <section className="section pageTop">
        <div className="container narrow">
          <ServerReadError message={error instanceof Error ? error.message : 'Could not load reviews.'} />
        </div>
      </section>
    );
  }

  const data = record(unwrap(payload));
  const buddy = record(data.provider);
  const reviews = list(payload, 'reviews');
  const buddyName = text(buddy.fullName ?? buddy.name, 'Verified Buddy');

  return (
    <section className="section pageTop">
      <div className="container narrow">
        {!!payload && (
          <>
            <div className="profileCard">
              <img
                className="avatar"
                src={safeImage(buddy.profileImage, '/assets/default-buddy-avatar.jpg')}
                alt={`${buddyName} profile`}
                width={160}
                height={160}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span className="pulseBadge">
                    <span className="pulseDot" />
                    Verified Buddy
                  </span>
                  <span className="channelBadge">100% Background Checked</span>
                </div>
                <h1 style={{ margin: '0 0 10px' }}>{buddyName}</h1>
                {buddy.bio ? <p style={{ marginBottom: '14px' }}>{text(buddy.bio)}</p> : null}
                <p style={{ fontSize: '13.5px', color: 'var(--muted)', marginBottom: '20px' }}>
                  Buddies are matched based on your preferred schedule, location, and verified category ratings.
                </p>
                <Link className="primaryButton" href="/book">
                  Book a Buddy <span className="btnArrow">→</span>
                </Link>
              </div>
            </div>

            <div className="reviewPanel">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <h2 style={{ margin: 0 }}>Customer Reviews</h2>
                <span className="channelBadge">{reviews.length} Verified Reviews</span>
              </div>
              {reviews.length ? (
                reviews.map((review, i) => (
                  <div className="review" key={id(review) || String(i)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <strong>{text(record(review.userId ?? review.user).fullName, 'Verified Customer')}</strong>
                      <span style={{ color: 'var(--amber)', fontSize: '12px' }}>★★★★★</span>
                    </div>
                    <p>{text(review.reviewText ?? review.review, 'Great experience with this Buddy.')}</p>
                  </div>
                ))
              ) : (
                <div className="emptyNoticeCard">
                  <p>No customer reviews available yet for this Buddy.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

