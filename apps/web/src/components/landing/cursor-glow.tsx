'use client';

import { useEffect, useRef } from 'react';

const SIZE = 200;
const HALF = SIZE / 2;

/** Desktop-only cursor accent — transform/opacity only (no blur / filter). */
export function CursorGlow({ enabled = true }: { enabled?: boolean }) {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(max-width: 767px)').matches) return;

    const glow = glowRef.current;
    if (!glow) return;

    let tx = -9999;
    let ty = -9999;
    let x = tx;
    let y = ty;
    let raf = 0;
    let running = false;
    let scrolling = false;
    let scrollIdle = 0;
    let hideIdle = 0;

    const tick = () => {
      x += (tx - x) * 0.2;
      y += (ty - y) * 0.2;
      glow.style.transform = `translate3d(${x - HALF}px, ${y - HALF}px, 0)`;

      const dx = tx - x;
      const dy = ty - y;
      if (dx * dx + dy * dy > 0.4) {
        raf = requestAnimationFrame(tick);
      } else {
        running = false;
        glow.style.transform = `translate3d(${tx - HALF}px, ${ty - HALF}px, 0)`;
      }
    };

    const onScroll = () => {
      scrolling = true;
      glow.style.opacity = '0';
      running = false;
      cancelAnimationFrame(raf);
      raf = 0;
      window.clearTimeout(scrollIdle);
      scrollIdle = window.setTimeout(() => {
        scrolling = false;
      }, 140);
    };

    const onMove = (e: PointerEvent) => {
      if (scrolling) return;
      tx = e.clientX;
      ty = e.clientY;
      glow.style.opacity = '1';
      window.clearTimeout(hideIdle);
      hideIdle = window.setTimeout(() => {
        glow.style.opacity = '0';
      }, 1200);
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
      window.clearTimeout(scrollIdle);
      window.clearTimeout(hideIdle);
    };
  }, [enabled]);

  if (!enabled) return null;

  return <div ref={glowRef} className="lp-cursor-glow" aria-hidden />;
}
