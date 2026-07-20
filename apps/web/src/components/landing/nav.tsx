'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { WorkhubLogo } from '@/components/shared/workhub-logo';

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? 'py-3' : 'py-5'}`}
    >
      <div className="mx-auto max-w-6xl px-4">
        <nav
          className={`grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl px-4 py-2.5 transition-all ${scrolled ? 'glass shadow-card' : ''}`}
        >
          <Link href="/" className="group flex min-w-0 items-center gap-2.5">
            <WorkhubLogo size="md" />
          </Link>
          <ul className="hidden items-center justify-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            {[
              ['Platform', '#platform'],
              ['AI Chat', '#ai-chat'],
              ['Integrations', '#integrations'],
              ['Home', '#home'],
            ].map(([label, href]) => (
              <li key={label}>
                <a href={href} className="group relative py-1 transition hover:text-foreground">
                  {label}
                  <span className="absolute bottom-[-0.125rem] left-0 h-px w-full origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100" />
                </a>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-end gap-2">
            <Link
              href="/login"
              className="hidden px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition hover:brightness-110"
            >
              <span className="relative z-10 inline-flex items-center gap-1.5">
                Get started{' '}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
              <span className="btn-shine" />
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
