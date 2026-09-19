'use client';
export default function CategoryImage({ src, alt }: { src: string; alt: string }) {
  return <img src={src} alt={alt} loading="lazy" decoding="async" onError={event => {
    const image = event.currentTarget;
    if (!image.src.endsWith('/assets/welcome-hero.png')) image.src = '/assets/welcome-hero.png';
  }}/>;
}
