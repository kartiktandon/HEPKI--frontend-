'use client';
export default function CategoryImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={event => {
        const image = event.currentTarget;
        if (!image.src.endsWith('/assets/welcome-hero.png')) image.src = '/assets/welcome-hero.png';
      }}
    />
  );
}

