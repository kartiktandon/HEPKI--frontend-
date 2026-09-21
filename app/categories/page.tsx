import { Suspense } from 'react';
import Catalog from '@/components/Catalog';

export const metadata = { title: 'Categories — Hepki' };

export default function CategoriesPage() {
  return (
    <section className="section pageTop">
      <div className="container">
        <div className="sectionHeading">
          <span className="eyebrow">SERVICES</span>
          <h1>Choose a category</h1>
          <p>Browse currently active services and book the right Buddy for your need.</p>
        </div>
        <Suspense fallback={<p role="status">Loading categories…</p>}>
          <Catalog />
        </Suspense>
      </div>
    </section>
  );
}

