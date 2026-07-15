'use client';

import { useEffect, useRef, useState } from 'react';

const DEFAULT_LABEL = 'Scroll';

/**
 * GPU custom cursor. Section sets data-cursor="Ask" etc.
 * Disabled on coarse pointers / reduced motion.
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const [enabled, setEnabled] = useState(false);
  const pos = useRef({ x: 0, y: 0 });
  const smooth = useRef({ x: 0, y: 0 });
  const hovering = useRef(false);

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduced) return;
    setEnabled(true);
    document.documentElement.classList.add('lp-cursor-on');

    let frame = 0;
    let running = true;

    const tick = () => {
      if (!running) return;
      const ease = hovering.current ? 0.28 : 0.16;
      smooth.current.x += (pos.current.x - smooth.current.x) * ease;
      smooth.current.y += (pos.current.y - smooth.current.y) * ease;

      const x = smooth.current.x;
      const y = smooth.current.y;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${
          hovering.current ? 1.65 : 1
        })`;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    const onMove = (e: MouseEvent) => {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;
    };

    const setLabel = (text: string) => {
      if (labelRef.current) labelRef.current.textContent = text;
    };

    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      const interactive = t.closest('a, button, [data-magnetic], [data-cursor-hover]');
      hovering.current = Boolean(interactive);
      ringRef.current?.classList.toggle('is-hover', hovering.current);

      const section = t.closest<HTMLElement>('[data-cursor]');
      const label =
        interactive?.getAttribute('data-cursor-hover') ||
        section?.dataset.cursor ||
        DEFAULT_LABEL;
      setLabel(label);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseover', onOver, { passive: true });

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.documentElement.classList.remove('lp-cursor-on');
    };
  }, []);

  if (!enabled) return null;

  return (
    <div className="lp-cursor" aria-hidden>
      <div ref={ringRef} className="lp-cursor-ring">
        <span ref={labelRef} className="lp-cursor-label">
          {DEFAULT_LABEL}
        </span>
      </div>
      <div ref={dotRef} className="lp-cursor-dot" />
    </div>
  );
}
