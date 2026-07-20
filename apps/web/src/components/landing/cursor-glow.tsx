'use client';

import { useEffect, useRef } from 'react';

const SIZE = 360;
const HALF = SIZE / 2;

export function CursorGlow({ enabled = true }: { enabled?: boolean }) {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(max-width: 767px)').matches) return;

    const glow = glowRef.current;
    if (!glow) return;

    let targetX = -9999;
    let targetY = -9999;
    let currentX = targetX;
    let currentY = targetY;
    let raf = 0;
    let running = false;
    let idle = 0;

    const tick = () => {
      currentX += (targetX - currentX) * 0.14;
      currentY += (targetY - currentY) * 0.14;

      glow.style.transform = `translate3d(${(currentX - HALF).toFixed(2)}px, ${(currentY - HALF).toFixed(2)}px, 0)`;

      const dx = targetX - currentX;
      const dy = targetY - currentY;
      if (dx * dx + dy * dy > 0.2) {
        raf = requestAnimationFrame(tick);
      } else {
        running = false;
        glow.style.transform = `translate3d(${(targetX - HALF).toFixed(2)}px, ${(targetY - HALF).toFixed(2)}px, 0)`;
      }
    };

    const onMove = (e: PointerEvent) => {
      if (document.documentElement.classList.contains('lp-scrolling')) return;
      targetX = e.clientX;
      targetY = e.clientY;
      glow.style.opacity = '1';
      window.clearTimeout(idle);
      idle = window.setTimeout(() => {
        glow.style.opacity = '0';
      }, 1600);
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
      window.clearTimeout(idle);
    };
  }, [enabled]);

  if (!enabled) return null;

  return <div ref={glowRef} className="lp-cursor-glow" aria-hidden />;
}
