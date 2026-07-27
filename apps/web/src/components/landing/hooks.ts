'use client';

import { useEffect, useState, type RefObject } from 'react';

type ScrollRefs = {
  barRef: RefObject<HTMLDivElement | null>;
  progressLineRef: RefObject<HTMLDivElement | null>;
};

export function scrollLandingTo(hash: string) {
  const el = document.querySelector(hash);
  if (!(el instanceof HTMLElement)) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 88;
  window.scrollTo({ top, behavior: 'smooth' });
}

export function useLandingEngine({ barRef, progressLineRef }: ScrollRefs) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const started = performance.now();
    const finish = () => {
      window.setTimeout(() => setReady(true), Math.max(0, 60 - (performance.now() - started)));
    };
    if (document.fonts?.ready) document.fonts.ready.then(finish).catch(finish);
    else finish();

    const onVisibility = () => {
      document.documentElement.classList.toggle('lp-hidden', document.hidden);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.documentElement.classList.remove('lp-hidden');
    };
  }, []);

  useEffect(() => {
    let raf = 0;
    let ticking = false;

    const update = () => {
      ticking = false;
      const limit = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${window.scrollY / limit})`;
      }

      const progressLine = progressLineRef.current;
      const wrap = progressLine?.closest('[data-progress-wrap]') as HTMLElement | null;
      if (!progressLine || !wrap) return;
      const r = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      if (r.bottom < -40 || r.top > vh + 40) return;
      const raw = 1 - (r.bottom - vh * 0.3) / (r.height + vh * 0.4);
      progressLine.style.transform = `scaleX(${Math.max(0, Math.min(1, raw))})`;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [barRef, progressLineRef]);

  return ready;
}
