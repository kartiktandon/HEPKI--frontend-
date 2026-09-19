import Link from 'next/link';
import { serverGet } from '@/lib/api/server';
import { id, list, record, safeImage, text, unwrap } from '@/lib/api/models';
import ServerReadError from '@/components/ServerReadError';
export default async function BuddyPage({ params }: { params: { id: string } }) {
  let payload: unknown;
  try { payload = await serverGet(`/api/v1/user/ratings/provider/${encodeURIComponent(params.id)}?page=1&limit=20`); }
  catch (error) { return <section className="section pageTop"><div className="container narrow"><ServerReadError message={error instanceof Error ? error.message : 'Could not load reviews.'}/></div></section>; }
  const data = record(unwrap(payload)); const buddy = record(data.provider); const reviews = list(payload, 'reviews');
  return <section className="section pageTop"><div className="container narrow">{!!payload && <><div className="profileCard"><img className="avatar" src={safeImage(buddy.profileImage, '/assets/default-buddy-avatar.jpg')} alt="Buddy profile" width={160} height={160}/><div><h1>{text(buddy.fullName ?? buddy.name, 'Buddy reviews')}</h1>{buddy.bio ? <p>{text(buddy.bio)}</p> : null}<p>Buddies are assigned based on availability when you book.</p><Link className="primaryButton" href="/book">Book a service</Link></div></div><div className="reviewPanel"><h2>Recent reviews</h2>{reviews.length ? reviews.map((review, i) => <div className="review" key={id(review) || String(i)}><strong>{text(record(review.userId ?? review.user).fullName, 'Customer')}</strong><p>{text(review.reviewText ?? review.review)}</p></div>) : <p>No reviews available yet.</p>}</div></>}</div></section>;
}
