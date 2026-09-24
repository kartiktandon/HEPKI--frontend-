'use client';

import { useEffect } from 'react';

const REVEAL_SELECTOR = '[data-hp-reveal]';

export default function ScrollAnimations() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.hepkiHome');
    if (!root) return;

    const elements = Array.from(root.querySelectorAll<HTMLElement>(REVEAL_SELECTOR));
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    root.classList.add('hpMotionReady');

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      elements.forEach(element => element.classList.add('hpInView'));
      return () => root.classList.remove('hpMotionReady');
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('hpInView');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
    );

    const immediateElements: HTMLElement[] = [];
    elements.forEach(element => {
      if (element.hasAttribute('data-hp-reveal-immediate')) {
        immediateElements.push(element);
      } else {
        observer.observe(element);
      }
    });

    // Two frames ensure the hero's initial state is painted before it reveals.
    let revealFrame = window.requestAnimationFrame(() => {
      revealFrame = window.requestAnimationFrame(() => {
        immediateElements.forEach(element => element.classList.add('hpInView'));
      });
    });

    return () => {
      window.cancelAnimationFrame(revealFrame);
      observer.disconnect();
      root.classList.remove('hpMotionReady');
    };
  }, []);

  return null;
}