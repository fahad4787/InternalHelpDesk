'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { WorkhubLogo } from '@/components/shared/workhub-logo';
import { scrollLandingTo } from './hooks';
import { PrimaryCta } from './primitives';

const NAV_LINKS = [
  { label: 'Platform', href: '#platform' },
  { label: 'AI Chat', href: '#ai-chat' },
  { label: 'Integrations', href: '#integrations' },
  { label: 'How it works', href: '#how-it-works' },
] as const;

export function LandingNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
      document.documentElement.classList.remove('lp-booting');
    };
  }, []);

  const go = (href: string) => {
    setOpen(false);
    scrollLandingTo(href);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 py-3">
      <div className="mx-auto max-w-6xl px-4">
        <nav className="glass grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl px-3 py-2 shadow-card sm:gap-4 sm:px-4 sm:py-2.5 max-lg:grid-cols-[minmax(0,1fr)_auto]">
          <Link
            href="/"
            className="group flex min-w-0 items-center gap-2.5"
            onClick={(e) => {
              if (window.location.pathname === '/') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setOpen(false);
              }
            }}
          >
            <WorkhubLogo size="md" className="max-md:[&_p]:hidden" />
          </Link>

          <ul className="hidden items-center justify-center gap-7 text-sm font-medium text-muted-foreground lg:flex">
            {NAV_LINKS.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  className="group relative py-1 transition hover:text-foreground"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollLandingTo(item.href);
                  }}
                >
                  {item.label}
                  <span className="absolute bottom-[-0.125rem] left-0 h-px w-full origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100" />
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-end gap-1.5 sm:gap-2">
            <Link
              href="/login"
              className="hidden px-3 py-2 text-sm font-medium text-foreground/80 transition hover:text-foreground lg:inline-flex"
            >
              Sign in
            </Link>
            <PrimaryCta href="/register" className="hidden px-4 py-2 text-sm md:inline-flex">
              Get started
            </PrimaryCta>
            <button
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-foreground transition hover:bg-surface lg:hidden"
              aria-expanded={open}
              aria-label={open ? 'Close menu' : 'Open menu'}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>

        {open && (
          <div className="glass mt-2 max-h-[min(70vh,28rem)] overflow-y-auto rounded-2xl p-3 shadow-card lg:hidden">
            <ul className="space-y-1">
              {NAV_LINKS.map((item) => (
                <li key={item.label}>
                  <button
                    type="button"
                    className="flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-medium text-foreground transition hover:bg-surface"
                    onClick={() => go(item.href)}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-2 grid gap-2 border-t border-border/60 pt-3">
              <Link
                href="/login"
                className="rounded-xl px-3 py-2.5 text-center text-sm font-medium text-foreground transition hover:bg-surface"
                onClick={() => setOpen(false)}
              >
                Sign in
              </Link>
              <PrimaryCta href="/register" className="w-full justify-center px-4 py-2.5" onClick={() => setOpen(false)}>
                Get started
              </PrimaryCta>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
