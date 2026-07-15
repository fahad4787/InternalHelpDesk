'use client';

import { useEffect, useRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type RevealProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  delay?: number;
  as?: 'div' | 'article' | 'li';
};

export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = 'div',
  ...rest
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-in');
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-in');
          io.disconnect();
        }
      },
      { threshold: 0.14, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={cn('lp-reveal', className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}
