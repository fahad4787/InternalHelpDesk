'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Calendar,
  Check,
  LayoutDashboard,
  MessageSquareText,
  Sparkles,
  Video,
  Zap,
} from 'lucide-react';

export function LandingHero() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const words = document.querySelectorAll<HTMLElement>('[data-word]');
    words.forEach((w, i) => {
      setTimeout(() => w.classList.add('is-visible'), 120 + i * 60);
    });
  }, []);

  const onMove = (e: React.MouseEvent) => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    const x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    const y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    setTilt({ x, y });
  };
  const onLeave = () => setTilt({ x: 0, y: 0 });

  const line1 = 'The command center for'.split(' ');
  const line2 = 'how work actually moves.'.split(' ');

  return (
    <section className="relative pb-24 pt-40 md:pb-32 md:pt-48">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="animate-blob absolute -top-24 right-[-8%] h-[520px] w-[520px] rounded-full opacity-70 blur-3xl"
          style={{
            background: 'radial-gradient(circle, oklch(0.78 0.16 45 / 0.55), transparent 60%)',
          }}
        />
        <div
          className="animate-float-slow absolute left-[-10%] top-40 h-[420px] w-[420px] rounded-full opacity-60 blur-3xl"
          style={{
            background: 'radial-gradient(circle, oklch(0.85 0.08 140 / 0.45), transparent 60%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(oklch(0.22 0.03 250) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div
            data-reveal
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1.5 text-xs font-medium text-foreground/70 backdrop-blur"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative h-2 w-2 rounded-full bg-primary" />
            </span>
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>New · Grounded AI answers with citations</span>
          </div>

          <h1 className="mt-6 text-[clamp(2.5rem,6.5vw,5.25rem)] font-extrabold leading-[0.98] tracking-tight">
            <span className="block">
              {line1.map((w, i) => (
                <span key={i} data-word className="mr-[0.25em]">
                  {w}
                </span>
              ))}
            </span>
            <span className="block text-gradient-brand">
              {line2.map((w, i) => (
                <span key={i} data-word className="mr-[0.25em]">
                  {w}
                </span>
              ))}
            </span>
          </h1>

          <p
            data-reveal
            data-delay="3"
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground"
          >
            AI answers from your documents. Live widgets from the apps you already pay for. One
            workspace for employee experience.
          </p>

          <div
            data-reveal
            data-delay="4"
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              href="/register"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:brightness-110"
            >
              <span
                className="absolute -inset-1 rounded-full opacity-70 blur-xl transition-opacity group-hover:opacity-100"
                style={{ background: 'var(--gradient-brand)' }}
              />
              <span className="relative z-10 inline-flex items-center gap-2">
                Start free <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
              <span className="btn-shine" />
            </Link>
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-6 py-3.5 text-sm font-semibold text-foreground backdrop-blur transition hover:border-primary/40 hover:bg-surface"
            >
              <span className="grid h-5 w-5 place-items-center rounded-full bg-primary/15 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <Video className="h-3 w-3" />
              </span>
              Sign in
            </Link>
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

        <div
          ref={wrapRef}
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          data-reveal
          className="relative mx-auto mt-16 max-w-5xl [perspective:1400px]"
          style={{
            transform: `translateY(0) rotateX(${(-tilt.y * 3).toFixed(2)}deg) rotateY(${(tilt.x * 4).toFixed(2)}deg)`,
            transition: 'transform .35s cubic-bezier(.22,1,.36,1)',
          }}
        >
          <div
            className="animate-glow-pulse absolute -inset-6 -z-10 rounded-[2rem] opacity-80 blur-3xl"
            style={{ background: 'var(--gradient-warm)' }}
          />
          <ProductMockup tilt={tilt} />

          <div
            className="absolute -left-6 top-16 hidden md:block"
            style={{
              transform: `translate3d(${tilt.x * -18}px, ${tilt.y * -12}px, 40px)`,
              transition: 'transform .35s cubic-bezier(.22,1,.36,1)',
            }}
          >
            <div className="glass animate-tilt rounded-2xl px-4 py-3 shadow-lift">
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

          <div
            className="absolute -right-4 bottom-20 hidden md:block"
            style={{
              transform: `translate3d(${tilt.x * 22}px, ${tilt.y * 16}px, 60px)`,
              transition: 'transform .35s cubic-bezier(.22,1,.36,1)',
            }}
          >
            <div className="glass rounded-2xl p-3 shadow-lift">
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

function ProductMockup({ tilt }: { tilt: { x: number; y: number } }) {
  return (
    <div
      className="relative rounded-[1.5rem] p-2 shadow-lift"
      style={{
        background: 'linear-gradient(180deg, oklch(1 0 0 / 0.6), oklch(1 0 0 / 0.2))',
        border: '1px solid oklch(1 0 0 / 0.6)',
      }}
    >
      <div className="ring-shimmer" />
      <div
        className="relative overflow-hidden rounded-[1.25rem]"
        style={{ background: 'oklch(0.19 0.03 250)' }}
      >
        <div className="noise-overlay" />
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.65_0.2_25)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.8_0.15_85)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.7_0.15_150)]" />
          <span className="ml-3 text-[11px] font-medium text-white/50">Workhub · Home</span>
          <span className="ml-auto font-mono text-[10px] text-white/40">workhub.app/home</span>
        </div>
        <div
          className="grid grid-cols-1 gap-4 p-5 md:grid-cols-3"
          style={{
            transform: `translate3d(${tilt.x * -6}px, ${tilt.y * -6}px, 0)`,
            transition: 'transform .35s cubic-bezier(.22,1,.36,1)',
          }}
        >
          <MockCard label="Tasks" icon={<LayoutDashboard className="h-3.5 w-3.5" />}>
            <ul className="space-y-2 text-sm text-white/85">
              <li className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded border border-white/25" /> Review onboarding
                guide
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
    <div className="group rounded-2xl border border-white/5 bg-white/[0.04] p-4 transition-all duration-300 hover:border-primary/30 hover:bg-white/[0.08]">
      <div className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50 transition group-hover:text-primary">
        {icon}
        {label}
      </div>
      {children}
    </div>
  );
}
