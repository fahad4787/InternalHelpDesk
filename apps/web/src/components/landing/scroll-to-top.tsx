'use client';

import { useEffect, useRef } from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ScrollToTop() {
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const btn = btnRef.current;
    if (!btn) return;

    let visible = false;
    let raf = 0;

    const sync = () => {
      raf = 0;
      const next = window.scrollY > 480;
      if (next === visible) return;
      visible = next;
      btn.style.opacity = next ? '1' : '0';
      btn.style.pointerEvents = next ? 'auto' : 'none';
      btn.setAttribute('aria-hidden', next ? 'false' : 'true');
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(sync);
    };

    sync();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <Button
      ref={btnRef}
      type="button"
      size="icon"
      aria-label="Scroll to top"
      aria-hidden="true"
      className="fixed bottom-6 right-6 z-50 h-11 w-11 rounded-full transition-opacity duration-200 max-sm:bottom-4 max-sm:right-4"
      style={{ opacity: 0, pointerEvents: 'none' }}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  );
}
