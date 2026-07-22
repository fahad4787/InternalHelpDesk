'use client';

import {
  Calendar,
  Check,
  LayoutDashboard,
  MessageSquareText,
  Sparkles,
  Video,
  Zap,
} from 'lucide-react';
import { AnimatedHeadline, PrimaryCta, SecondaryCta } from './primitives';

export function LandingHero() {
  return (
    <section
      data-tone="page"
      className="relative isolate overflow-hidden pb-24 pt-40 md:pb-32 md:pt-48 max-md:pb-16 max-md:pt-28"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <div
          className="lp-hero-blob absolute -left-[10%] -top-[15%] h-[70vmin] w-[70vmin] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(255, 147, 90, 0.45) 0%, rgba(255, 147, 90, 0) 68%)',
          }}
        />
        <div
          className="lp-hero-blob lp-hero-blob--alt absolute -right-[8%] -top-[18%] h-[65vmin] w-[65vmin] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(253, 104, 68, 0.38) 0%, rgba(253, 104, 68, 0) 68%)',
          }}
        />
        <div
          className="lp-hero-blob lp-hero-blob--slow absolute -bottom-[20%] -left-[12%] h-[72vmin] w-[72vmin] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(186, 156, 239, 0.32) 0%, rgba(186, 156, 239, 0) 68%)',
          }}
        />
        <div
          className="lp-hero-blob lp-hero-blob--alt absolute -bottom-[18%] -right-[10%] h-[75vmin] w-[75vmin] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(179, 219, 170, 0.4) 0%, rgba(179, 219, 170, 0) 68%)',
            animationDelay: '-6s',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div
            data-reveal
            className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-surface/80 px-3 py-1.5 text-xs font-medium text-foreground/70"
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative h-2 w-2 rounded-full bg-primary" />
            </span>
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="text-left leading-snug">
              <span className="sm:hidden">New · Grounded AI answers</span>
              <span className="hidden sm:inline">New · Grounded AI answers with citations</span>
            </span>
          </div>

          <AnimatedHeadline
            lines={['The command center for', 'how work actually moves.']}
            accentLine={1}
          />

          <p data-reveal data-delay="3" className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            AI answers from your documents. Live widgets from the apps you already pay for. One
            workspace for employee experience.
          </p>

          <div data-reveal data-delay="4" className="mt-9 flex flex-wrap items-center justify-center gap-3 max-sm:flex-col max-sm:items-stretch">
            <PrimaryCta href="/register" className="max-sm:justify-center">
              Start free
            </PrimaryCta>
            <SecondaryCta href="/login" className="max-sm:justify-center">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-primary/15 text-primary">
                <Video className="h-3 w-3" />
              </span>
              Sign in
            </SecondaryCta>
          </div>

          <div
            data-reveal
            data-delay="5"
            className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground"
          >
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-primary" /> No credit card
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-primary" /> Live in minutes
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-primary" /> SOC-ready workspaces
            </span>
          </div>
        </div>

        <div data-reveal className="relative mx-auto mt-16 max-w-5xl">
          <div
            aria-hidden
            className="absolute -inset-8 -z-10 rounded-[2rem] opacity-50 max-sm:-inset-4"
            style={{
              background:
                'radial-gradient(ellipse at center, oklch(0.85 0.15 45 / 0.28), transparent 68%)',
            }}
          />
          <ProductMockup />

          <div className="absolute -left-6 top-16 hidden lg:block">
            <div className="lp-float glass rounded-2xl px-4 py-3 shadow-lift">
              <div className="flex items-center gap-2">
                <span
                  className="grid h-8 w-8 place-items-center rounded-lg text-primary-foreground"
                  style={{ background: 'var(--gradient-brand)' }}
                >
                  <Zap className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Answered
                  </div>
                  <div className="text-sm font-semibold">2.3s · with citation</div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -right-4 bottom-20 hidden lg:block">
            <div className="lp-float lp-float--delay glass rounded-2xl p-3 shadow-lift">
              <div className="flex -space-x-2">
                {[35, 45, 140, 300].map((h, i) => (
                  <span
                    key={i}
                    className="grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold text-white ring-2 ring-white"
                    style={{ background: `oklch(0.7 0.16 ${h})` }}
                  >
                    {['A', 'M', 'P', 'R'][i]}
                  </span>
                ))}
              </div>
              <div className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Team online · 12
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductMockup() {
  return (
    <div
      className="relative rounded-[1.5rem] p-2 shadow-lift"
      style={{
        background: 'linear-gradient(180deg, oklch(1 0 0 / 0.6), oklch(1 0 0 / 0.2))',
        border: '1px solid oklch(1 0 0 / 0.6)',
      }}
    >
      <div className="relative overflow-hidden rounded-[1.25rem]" style={{ background: 'oklch(0.19 0.03 250)' }}>
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[oklch(0.65_0.2_25)]" />
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[oklch(0.8_0.15_85)]" />
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[oklch(0.7_0.15_150)]" />
          <span className="ml-3 truncate text-[11px] font-medium text-white/50">Workhub · Home</span>
          <span className="ml-auto font-mono text-[10px] text-white/40 max-sm:hidden">workhub.app/home</span>
        </div>
        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-3">
          <MockCard label="Tasks" icon={<LayoutDashboard className="h-3.5 w-3.5" />}>
            <ul className="space-y-2 text-sm text-white/85">
              <li className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded border border-white/25" /> Review onboarding guide
              </li>
              <li className="flex items-center gap-2 text-white/40 line-through">
                <span className="grid h-3.5 w-3.5 place-items-center rounded bg-primary">
                  <Check className="h-2.5 w-2.5 text-primary-foreground" />
                </span>{' '}
                Sync Monday board
              </li>
              <li className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded border border-white/25" /> Approve time-off
              </li>
            </ul>
          </MockCard>
          <MockCard label="Today" icon={<Calendar className="h-3.5 w-3.5" />}>
            <div className="space-y-3 text-sm text-white/85">
              <div>
                <div className="font-medium">Standup · 9:30</div>
                <div className="text-xs text-white/45">Google Meet</div>
              </div>
              <div>
                <div className="font-medium">Design review · 2:00</div>
                <div className="text-xs text-white/45">Zoom</div>
              </div>
            </div>
          </MockCard>
          <MockCard label="AI Chat" icon={<MessageSquareText className="h-3.5 w-3.5" />}>
            <div className="space-y-3">
              <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-tr-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground">
                Parental leave policy?
              </div>
              <div className="w-fit max-w-[92%] rounded-2xl rounded-tl-md bg-white/5 px-3 py-2 text-xs text-white/85">
                16 weeks for full-time employees.{' '}
                <span className="italic text-white/45">HR Handbook §4</span>
              </div>
            </div>
          </MockCard>
        </div>
      </div>
    </div>
  );
}

function MockCard({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="group rounded-2xl border border-white/5 bg-white/[0.04] p-4 transition-colors duration-300 hover:border-primary/30 hover:bg-white/[0.08]">
      <div className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50 transition group-hover:text-primary">
        {icon}
        {label}
      </div>
      {children}
    </div>
  );
}
