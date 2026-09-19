import BookingWizard from '@/components/BookingWizard';
export const metadata = { title: 'Book a Buddy' };
export default function BookPage(){return <section className="section pageTop"><div className="container narrow"><div className="sectionHeading centered"><span className="eyebrow">BOOKING</span><h1>Book a Buddy</h1><p>Complete your booking in a few quick steps.</p></div><BookingWizard/></div></section>}
