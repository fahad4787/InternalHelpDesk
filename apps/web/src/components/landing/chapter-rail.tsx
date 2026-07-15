'use client';

import { useEffect, useState } from 'react';
import { useScrollEngine } from './scroll-engine';

const CHAPTERS = [
  { id: 'hero', label: 'Intro' },
  { id: 'manifesto', label: 'Why' },
  { id: 'platform', label: 'Platform' },
  { id: 'chat', label: 'AI Chat' },
  { id: 'knowledge', label: 'Docs' },
  { id: 'integrations', label: 'Apps' },
  { id: 'home', label: 'Home' },
  { id: 'how', label: 'Path' },
  { id: 'cta', label: 'Start' },
] as const;

/** Fixed chapter rail — desktop only, IO driven (no scroll spam). */
export function ChapterRail() {
  const { scrollTo } = useScrollEngine();
  const [active, setActive] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(max-width: 1100px)').matches) return;

    const nodes = CHAPTERS.map((c) =>
      document.querySelector<HTMLElement>(`[data-chapter="${c.id}"]`),
    ).filter(Boolean) as HTMLElement[];

    if (!nodes.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const idx = nodes.indexOf(visible.target as HTMLElement);
        if (idx >= 0) setActive(idx);
      },
      { threshold: [0.25, 0.45, 0.6], rootMargin: '-20% 0px -35% 0px' },
    );

    nodes.forEach((n) => io.observe(n));
    setShow(true);
    return () => io.disconnect();
  }, []);

  if (!show) return null;

  return (
    <aside className="lp-rail" aria-label="Sections">
      <div className="lp-rail-index font-heading">
        {String(active + 1).padStart(2, '0')}
        <span>/{String(CHAPTERS.length).padStart(2, '0')}</span>
      </div>
      <ul>
        {CHAPTERS.map((c, i) => (
          <li key={c.id}>
            <button
              type="button"
              className={i === active ? 'is-active' : undefined}
              data-cursor-hover={c.label}
              onClick={() => {
                const el = document.querySelector(`[data-chapter="${c.id}"]`);
                if (el) scrollTo(el as HTMLElement);
              }}
            >
              <i />
              <span>{c.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
