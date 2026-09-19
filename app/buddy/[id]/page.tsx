'use client';
import Link from 'next/link';
import { useResource } from '@/lib/api/hooks';
import { id, list, record, safeImage, text, unwrap } from '@/lib/api/models';
import { ErrorNotice } from '@/components/ApiState';
export default function BuddyPage({ params }: { params: { id: string } }) {
  const resource = useResource(`/api/v1/user/ratings/provider/${encodeURIComponent(params.id)}?page=1&limit=20`);
  const data = record(unwrap(resource.data)); const buddy = record(data.provider); const reviews = list(resource.data, 'reviews');
  return <section className="section pageTop"><div className="container narrow"><ErrorNotice message={resource.error} retry={resource.reload}/>{resource.loading ? <p role="status">Loading Buddy reviews…</p> : !!resource.data && <><div className="profileCard"><img className="avatar" src={safeImage(buddy.profileImage, '/assets/default-buddy-avatar.jpg')} alt="Buddy profile" width={160} height={160}/><div><h1>{text(buddy.fullName ?? buddy.name, 'Buddy reviews')}</h1>{buddy.bio ? <p>{text(buddy.bio)}</p> : null}<p>Buddies are assigned based on availability when you book.</p><Link className="primaryButton" href="/book">Book a service</Link></div></div><div className="reviewPanel"><h2>Recent reviews</h2>{reviews.length ? reviews.map((review, i) => <div className="review" key={id(review) || String(i)}><strong>{text(record(review.userId ?? review.user).fullName, 'Customer')}</strong><p>{text(review.reviewText ?? review.review)}</p></div>) : <p>No reviews available yet.</p>}</div></>}</div></section>;
}
