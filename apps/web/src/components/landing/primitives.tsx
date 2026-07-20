'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SoftOrb({
  className,
  color = 'brand',
}: {
  className?: string;
  color?: 'brand' | 'warm' | 'mint';
}) {
  const bg =
    color === 'mint'
      ? 'radial-gradient(circle, oklch(0.85 0.08 140 / 0.4), transparent 70%)'
      : color === 'warm'
        ? 'radial-gradient(circle, oklch(0.78 0.16 45 / 0.42), transparent 70%)'
        : 'radial-gradient(circle, oklch(0.7 0.19 35 / 0.42), transparent 70%)';

  return <div aria-hidden className={cn('pointer-events-none absolute rounded-full', className)} style={{ background: bg }} />;
}

export function Kicker({ children }: { children: React.ReactNode; light?: boolean }) {
  return (
    <div data-reveal className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
      <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-glow" />
      {children}
    </div>
  );
}

export function AnimatedHeadline({
  lines,
  accentLine,
}: {
  lines: string[];
  accentLine?: number;
}) {
  const [play, setPlay] = useState(false);
  const reducedRef = useRef(false);

  useEffect(() => {
    reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedRef.current) {
      setPlay(true);
      return;
    }

    const start = () => setPlay(true);
    if (!document.getElementById('lp-boot-loader')) {
      start();
      return;
    }
    window.addEventListener('lp-ready', start, { once: true });
    return () => window.removeEventListener('lp-ready', start);
  }, []);

  let index = 0;

  return (
    <h1 className="mt-6 text-[clamp(2.5rem,6.5vw,5.25rem)] font-extrabold leading-[1.02] tracking-tight">
      {lines.map((line, lineIdx) => (
        <span
          key={lineIdx}
          className={cn('lp-headline-line block')}
        >
          {line.split(' ').map((word) => {
            const i = index++;
            const accent = accentLine === lineIdx;
            return (
              <span key={`${lineIdx}-${word}-${i}`} className={cn('lp-word', play && 'is-in')}>
                <span
                  className={cn('lp-word-inner', accent && 'text-gradient-brand')}
                  style={{ transitionDelay: play ? `${90 + i * 75}ms` : '0ms' }}
                >
                  {word}
                </span>
              </span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}

export function FeatureCard({
  title,
  description,
  icon: Icon,
  delay,
  className,
  children,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  delay?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      data-reveal
      data-delay={delay}
      className={cn(
        'lp-card group relative overflow-hidden rounded-3xl border border-border/60 bg-card p-8 shadow-card',
        className,
      )}
    >
      <div aria-hidden className="lp-card-glow" />
      <div className="relative">
        {Icon && (
          <div
            className="mb-6 grid h-12 w-12 place-items-center rounded-2xl text-primary-foreground shadow-glow transition-transform duration-300 group-hover:rotate-3 group-hover:scale-105"
            style={{ background: 'var(--gradient-brand)' }}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
        <h3 className="text-2xl font-bold">{title}</h3>
        <p className="mt-2 text-muted-foreground">{description}</p>
        {children}
      </div>
    </div>
  );
}

export function PrimaryCta({
  href,
  children,
  className,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:brightness-110',
        className,
      )}
    >
      <span className="relative z-10 inline-flex items-center gap-2">
        {children}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </span>
      <span className="btn-shine" />
    </Link>
  );
}

export function SecondaryCta({
  href,
  children,
  className,
  dark = false,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-6 py-3.5 text-sm font-semibold transition',
        dark
          ? 'border-white/15 bg-white/8 text-white hover:border-white/30 hover:bg-white/12'
          : 'border-border bg-surface text-foreground hover:border-primary/40 hover:bg-surface',
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function Marquee({
  children,
  speed = 'normal',
  className,
  pauseOnHover = false,
}: {
  children: React.ReactNode;
  speed?: 'normal' | 'slow';
  className?: string;
  pauseOnHover?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    const track = trackRef.current;
    if (!el || !track) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        track.classList.toggle(
          speed === 'slow' ? 'animate-marquee-slow' : 'animate-marquee',
          entry.isIntersecting && !document.hidden,
        );
      },
      { rootMargin: '60px' },
    );
    io.observe(el);

    const onVis = () => {
      if (document.hidden) {
        track.classList.remove('animate-marquee', 'animate-marquee-slow');
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [speed]);

  return (
    <div
      ref={rootRef}
      className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]"
    >
      <div
        ref={trackRef}
        className={cn(
          'flex w-max gap-3 py-2',
          pauseOnHover && 'hover:[animation-play-state:paused]',
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
