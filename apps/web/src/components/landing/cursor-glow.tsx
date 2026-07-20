'use client';

import { useEffect, useRef } from 'react';

export function CursorGlow({ enabled = true }: { enabled?: boolean }) {
  const glowRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(max-width: 767px)').matches) return;

    const glow = glowRef.current;
    const dot = dotRef.current;
    if (!glow || !dot) return;

    let x = -9999;
    let y = -9999;
    let raf = 0;
    let pending = false;
    let idle = 0;

    const flush = () => {
      pending = false;
      glow.style.transform = `translate3d(${(x - 120).toFixed(1)}px, ${(y - 120).toFixed(1)}px, 0)`;
      dot.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    };

    const onMove = (e: PointerEvent) => {
      if (document.documentElement.classList.contains('lp-scrolling')) return;
      x = e.clientX;
      y = e.clientY;
      glow.style.opacity = '1';
      dot.style.opacity = '1';
      window.clearTimeout(idle);
      idle = window.setTimeout(() => {
        glow.style.opacity = '0';
        dot.style.opacity = '0';
      }, 1800);
      if (pending) return;
      pending = true;
      raf = requestAnimationFrame(flush);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
      window.clearTimeout(idle);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div ref={glowRef} className="lp-cursor-glow" aria-hidden />
      <div ref={dotRef} className="lp-cursor-dot" aria-hidden />
    </>
  );
}
