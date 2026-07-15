'use client';

/**
 * Single Lenis + RAF tick — tuned for a silkier scroll feel.
 * Visuals unchanged; lighter parallax math (no per-frame layout reads).
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import Lenis from 'lenis';

type ScrollEngineApi = {
  scrollTo: (target: string | number | HTMLElement, offset?: number) => void;
};

type ParallaxCache = {
  mid: number;
  speed: number;
};

const ScrollEngineContext = createContext<ScrollEngineApi>({
  scrollTo: () => undefined,
});

export function useScrollEngine() {
  return useContext(ScrollEngineContext);
}

export function ScrollEngine({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const activeParallax = useRef(new Set<HTMLElement>());
  const cacheRef = useRef(new Map<HTMLElement, ParallaxCache>());
  const kineticRef = useRef<HTMLElement[]>([]);
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const measureEl = (el: HTMLElement, scroll: number) => {
      const prev = el.style.transform;
      el.style.transform = 'none';
      const rect = el.getBoundingClientRect();
      el.style.transform = prev;
      cacheRef.current.set(el, {
        mid: rect.top + scroll + rect.height * 0.5,
        speed: Number(el.dataset.parallax ?? 0),
      });
    };

    const collect = () => {
      navRef.current = document.querySelector<HTMLElement>('.lp-nav');
      kineticRef.current = Array.from(
        document.querySelectorAll<HTMLElement>('[data-kinetic]'),
      );
      return Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
    };

    const io = new IntersectionObserver(
      (entries) => {
        const scroll = lenisRef.current?.scroll ?? window.scrollY;
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            measureEl(el, scroll);
            activeParallax.current.add(el);
          } else {
            activeParallax.current.delete(el);
          }
        }
      },
      { rootMargin: '20% 0px' },
    );

    const wireParallax = () => {
      const els = collect();
      const scroll = lenisRef.current?.scroll ?? window.scrollY;
      els.forEach((el) => {
        io.observe(el);
        measureEl(el, scroll);
      });
    };
    wireParallax();

    const applyParallax = (scroll: number, vh: number) => {
      if (reduced) return;
      const viewMid = scroll + vh * 0.5;
      for (const el of activeParallax.current) {
        const cached = cacheRef.current.get(el);
        if (!cached || !cached.speed) continue;
        const y = (cached.mid - viewMid) * cached.speed;
        el.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
      }
    };

    const applyKinetic = (scroll: number) => {
      if (reduced) return;
      for (const el of kineticRef.current) {
        const factor = Number(el.dataset.kinetic ?? 0.12);
        el.style.transform = `translate3d(${(-scroll * factor).toFixed(1)}px, 0, 0)`;
      }
    };

    if (reduced) {
      root.style.setProperty('--lp-progress', '0');
      return () => io.disconnect();
    }

    const lenis = new Lenis({
      // Slightly silkier than before — no visual redesign
      lerp: 0.072,
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1.05,
      wheelMultiplier: 0.82,
    });
    lenisRef.current = lenis;

    let frame = 0;
    let lastScrolled = false;
    let lastProgress = -1;
    let vh = window.innerHeight;

    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    const onScroll = (instance: Lenis) => {
      const scroll = instance.scroll;
      const limit = instance.limit;
      const progress = limit > 0 ? Math.min(1, scroll / limit) : 0;

      if (Math.abs(progress - lastProgress) > 0.0008) {
        root.style.setProperty('--lp-progress', progress.toFixed(4));
        lastProgress = progress;
      }

      const scrolled = scroll > 24;
      if (scrolled !== lastScrolled) {
        navRef.current?.classList.toggle('is-scrolled', scrolled);
        lastScrolled = scrolled;
      }

      applyParallax(scroll, vh);
      applyKinetic(scroll);
    };

    lenis.on('scroll', onScroll);
    onScroll(lenis);

    const onResize = () => {
      vh = window.innerHeight;
      wireParallax();
      lenis.resize();
    };
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      io.disconnect();
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const api = useMemo<ScrollEngineApi>(
    () => ({
      scrollTo: (target, offset = -80) => {
        const lenis = lenisRef.current;
        if (lenis) {
          lenis.scrollTo(target, { offset, duration: 1.2 });
          return;
        }
        if (typeof target === 'string' && target.startsWith('#')) {
          document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });
        }
      },
    }),
    [],
  );

  return (
    <ScrollEngineContext.Provider value={api}>{children}</ScrollEngineContext.Provider>
  );
}
