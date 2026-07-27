'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { ButtonShine, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Reveal, type RevealVariant } from './reveal';

export function SoftOrb({
  className,
  color = 'brand',
}: {
  className?: string;
  color?: 'brand' | 'warm' | 'mint';
  animate?: boolean;
}) {
  const bg =
    color === 'mint'
      ? 'radial-gradient(circle, oklch(0.85 0.08 140 / 0.55), oklch(0.85 0.08 140 / 0.18) 45%, transparent 70%)'
      : color === 'warm'
        ? 'radial-gradient(circle, oklch(0.78 0.16 45 / 0.6), oklch(0.78 0.16 45 / 0.2) 45%, transparent 70%)'
        : 'radial-gradient(circle, oklch(0.7 0.19 35 / 0.6), oklch(0.7 0.19 35 / 0.22) 45%, transparent 70%)';

  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute rounded-full', className)}
      style={{ background: bg }}
    />
  );
}

export function Kicker({ children }: { children: React.ReactNode; light?: boolean }) {
  return (
    <Reveal className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
      <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-glow" />
      {children}
    </Reveal>
  );
}

export function BrandText({ text }: { text: string }) {
  return <span className="text-gradient-brand">{text}</span>;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.08 },
  },
};

const lineVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.045 },
  },
};

const clipVariants = {
  hidden: {},
  visible: {},
};

const wordVariants = {
  hidden: { y: '105%', opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function AnimatedHeadline({
  lines,
  accentLine,
}: {
  lines: string[];
  accentLine?: number;
}) {
  const [play, setPlay] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPlay(true);
      return;
    }

    let seen = false;
    try {
      seen = sessionStorage.getItem('lp-booted') === '1';
    } catch {
      /* ignore */
    }

    // Always start — short wait after first boot, near-instant on return visits.
    const delay = seen ? 40 : 300;
    const t = window.setTimeout(() => setPlay(true), delay);
    const onReady = () => {
      window.clearTimeout(t);
      setPlay(true);
    };
    window.addEventListener('lp-ready', onReady, { once: true });
    if (!document.getElementById('lp-boot-loader')) setPlay(true);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener('lp-ready', onReady);
    };
  }, []);

  return (
    <motion.h1
      className="mt-6 text-[clamp(2.5rem,6.5vw,5.25rem)] font-extrabold leading-[1.02] tracking-tight max-sm:text-[clamp(2rem,8vw,5.25rem)]"
      initial="hidden"
      animate={play ? 'visible' : 'hidden'}
      variants={containerVariants}
    >
      {lines.map((line, lineIdx) => {
        const accent = accentLine === lineIdx;
        const words = accent ? [line] : line.split(' ');

        return (
          <motion.span key={lineIdx} className="block" variants={lineVariants}>
            {words.map((word, wordIdx) => (
              <motion.span
                key={`${lineIdx}-${wordIdx}`}
                className="mr-[0.28em] inline-block max-w-full overflow-hidden align-bottom pb-[0.12em] mb-[-0.12em] last:mr-0"
                variants={clipVariants}
              >
                <motion.span
                  className={cn('inline-block will-change-transform', accent && 'text-gradient-brand')}
                  variants={wordVariants}
                >
                  {word}
                </motion.span>
              </motion.span>
            ))}
          </motion.span>
        );
      })}
    </motion.h1>
  );
}

export function FeatureCard({
  title,
  description,
  icon: Icon,
  delay,
  reveal = 'up',
  className,
  children,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  delay?: number;
  reveal?: RevealVariant;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Reveal
      variant={reveal}
      delay={delay}
      className={cn(
        'lp-card group relative overflow-hidden rounded-3xl border border-border/60 bg-card p-8 shadow-card max-sm:p-6',
        className,
      )}
    >
      <div aria-hidden className="lp-card-glow" />
      <div className="relative">
        {Icon && (
          <div
            className="mb-6 grid h-12 w-12 place-items-center rounded-2xl text-primary-foreground shadow-glow transition-transform duration-200 group-hover:rotate-3 group-hover:scale-105"
            style={{ background: 'var(--gradient-brand)' }}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
        <h3 className="text-2xl font-bold">{title}</h3>
        <p className="mt-2 text-muted-foreground">{description}</p>
        {children}
      </div>
    </Reveal>
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
    <motion.div
      className="inline-flex max-sm:w-full"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
    >
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          buttonVariants({ variant: 'default', size: 'lg' }),
          'h-auto w-full rounded-full px-6 py-3.5',
          className,
        )}
      >
        <span className="relative z-10 inline-flex items-center gap-2">
          {children}
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </span>
        <ButtonShine />
      </Link>
    </motion.div>
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
      { rootMargin: '40px' },
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
