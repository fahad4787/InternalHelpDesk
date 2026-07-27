'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AUTH_SLIDES } from '@/constants/auth-slides';
import { cn } from '@/lib/utils';

const INTERVAL_MS = 5000;

export function AuthPanelSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const count = AUTH_SLIDES.length;
  const slide = AUTH_SLIDES[index] ?? AUTH_SLIDES[0];

  const goTo = useCallback(
    (next: number) => {
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (paused || reduceMotion || count < 2) return;

    const id = window.setInterval(() => {
      if (document.hidden) return;
      setIndex((i) => (i + 1) % count);
    }, INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [paused, reduceMotion, count]);

  return (
    <div
      className="flex flex-1 flex-col justify-center py-10"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative min-h-[280px] xl:min-h-[300px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={slide.id}
            initial={reduceMotion ? false : { opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: -12 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
              {slide.eyebrow}
            </p>
            <h2 className="mt-3 font-heading text-[2rem] font-bold leading-tight text-white xl:text-[2.35rem]">
              {slide.title}
              {slide.accent ? (
                <>
                  <br />
                  <span className="text-brand">{slide.accent}</span>
                </>
              ) : null}
            </h2>
            <p className="mt-5 max-w-sm text-base leading-relaxed text-sidebar-muted">
              {slide.description}
            </p>
            <ul className="mt-8 space-y-3" role="list">
              {slide.points.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-white/80">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>
      </div>

      <div
        className="mt-10 flex items-center gap-2"
        role="tablist"
        aria-label="Feature highlights"
      >
        {AUTH_SLIDES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-label={`Show slide: ${s.eyebrow}`}
            aria-current={i === index ? 'true' : undefined}
            aria-selected={i === index}
            onClick={() => goTo(i)}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              i === index ? 'w-7 bg-brand' : 'w-1.5 bg-white/25 hover:bg-white/45',
            )}
          />
        ))}
      </div>
    </div>
  );
}
