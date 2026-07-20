'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

type ScrollRefs = {
  barRef: RefObject<HTMLDivElement | null>;
  progressLineRef: RefObject<HTMLDivElement | null>;
};

export function scrollLandingTo(hash: string) {
  const el = document.querySelector(hash);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 88;
  window.scrollTo({ top, behavior: 'smooth' });
}

export function useLandingEngine({ barRef, progressLineRef }: ScrollRefs) {
  const [ready, setReady] = useState(false);
  const progressVisible = useRef(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const started = performance.now();
    const root = document.querySelector('.lp-radiant') ?? document.body;

    let revealIo: IntersectionObserver | null = null;
    const observed = new WeakSet<Element>();

    const watchReveals = (scope: ParentNode = root) => {
      if (reduced) {
        scope.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
          el.classList.add('is-visible');
        });
        return;
      }
      if (!revealIo) return;
      scope.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
        if (observed.has(el) || el.classList.contains('is-visible')) return;
        observed.add(el);
        revealIo!.observe(el);
      });
    };

    if (!reduced) {
      revealIo = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            e.target.classList.add('is-visible');
            revealIo?.unobserve(e.target);
          }
        },
        { threshold: 0.1, rootMargin: '0px 0px -6% 0px' },
      );
    }

    watchReveals();

    let progressObserved: Element | null = null;
    const progressIo = new IntersectionObserver(
      ([entry]) => {
        progressVisible.current = entry.isIntersecting;
      },
      { rootMargin: '120px' },
    );

    const syncProgressObserver = () => {
      const wrap = progressLineRef.current?.closest('[data-progress-wrap]') as HTMLElement | null;
      if (!wrap || wrap === progressObserved) return;
      if (progressObserved) progressIo.unobserve(progressObserved);
      progressIo.observe(wrap);
      progressObserved = wrap;
    };

    syncProgressObserver();

    const mo = new MutationObserver((mutations) => {
      let needsReveal = false;
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches?.('[data-reveal]') || node.querySelector?.('[data-reveal]')) {
            needsReveal = true;
          }
        });
      }
      if (needsReveal) watchReveals();
      syncProgressObserver();
    });
    mo.observe(root, { childList: true, subtree: true });

    let raf = 0;
    let ticking = false;
    let scrollIdle = 0;

    const updateScrollUi = () => {
      ticking = false;
      const h = document.documentElement;
      const limit = Math.max(1, h.scrollHeight - h.clientHeight);
      const bar = barRef.current;
      if (bar) bar.style.transform = `scaleX(${h.scrollTop / limit})`;

      if (!progressVisible.current) return;
      const progressLine = progressLineRef.current;
      const wrap = progressLine?.closest('[data-progress-wrap]') as HTMLElement | null;
      if (!progressLine || !wrap) return;
      const r = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      const raw = 1 - (r.bottom - vh * 0.3) / (r.height + vh * 0.4);
      progressLine.style.transform = `scaleX(${Math.max(0, Math.min(1, raw))})`;
    };

    const onScroll = () => {
      document.documentElement.classList.add('lp-scrolling');
      window.clearTimeout(scrollIdle);
      scrollIdle = window.setTimeout(() => {
        document.documentElement.classList.remove('lp-scrolling');
      }, 140);

      if (ticking) return;
      ticking = true;
      raf = requestAnimationFrame(updateScrollUi);
    };

    updateScrollUi();
    window.addEventListener('scroll', onScroll, { passive: true });

    const onVisibility = () => {
      document.documentElement.classList.toggle('lp-hidden', document.hidden);
    };
    document.addEventListener('visibilitychange', onVisibility);

    const finish = () => {
      const wait = Math.max(0, 180 - (performance.now() - started));
      window.setTimeout(() => setReady(true), wait);
    };

    if (document.fonts?.ready) {
      document.fonts.ready.then(finish).catch(finish);
    } else {
      finish();
    }

    return () => {
      revealIo?.disconnect();
      progressIo.disconnect();
      mo.disconnect();
      cancelAnimationFrame(raf);
      window.clearTimeout(scrollIdle);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
      document.documentElement.classList.remove('lp-scrolling', 'lp-hidden');
    };
  }, [barRef, progressLineRef]);

  return ready;
}
