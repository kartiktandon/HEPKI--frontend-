import Link from 'next/link';
import CategoryImage from './CategoryImage';
import { type Category, money } from '@/lib/api/models';
export default function CategoryCard({ item }: { item: Category }) {
  return <article className="categoryCard"><div className="categoryImage"><CategoryImage src={item.image} alt={item.name}/></div><div className="categoryBody"><h3>{item.name}</h3><p>{item.description}</p><div className="cardFooter"><strong>{item.rate !== undefined ? `From ${money(item.rate)}/hr` : 'View services'}</strong><Link href={`/book?category=${encodeURIComponent(item.id)}`}>Book →</Link></div></div></article>;
}
