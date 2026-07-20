'use client';

import { type RefObject } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Bell,
  Blocks,
  BookOpen,
  Calendar,
  Check,
  FileText,
  Home,
  LayoutDashboard,
  MessageSquareText,
  Plug,
  Quote,
  ShieldCheck,
  UserCog,
  Users,
  Video,
  Wrench,
} from 'lucide-react';
import { appConfig } from '@/config/app.config';
import { MARKETPLACE_APPS } from '@/constants/dashboard-integrations';
import { WorkhubLogo } from '@/components/shared/workhub-logo';
import {
  IntegrationIcon,
  isIntegrationIconProvider,
} from '@/components/shared/integration-icon';
import {
  FeatureCard,
  Kicker,
  Marquee,
  PrimaryCta,
  SecondaryCta,
  SoftOrb,
} from './primitives';
import { scrollLandingTo } from './hooks';

const APPS = MARKETPLACE_APPS.filter((a) => a.available);

function AppBrandIcon({ iconKey, size = 'sm' }: { iconKey: string; size?: 'sm' | 'md' }) {
  const provider = isIntegrationIconProvider(iconKey) ? iconKey : 'JIRA';
  return <IntegrationIcon provider={provider} size={size} className="shadow-none" />;
}

export function LogoMarquee() {
  const items = ['Knowledge', 'AI Chat', 'Integrations', 'Dashboard', 'Workspace', 'Widgets', 'Citations', 'OAuth'];
  return (
    <section data-tone="surface" className="lp-section relative border-y border-border/60 bg-surface/40 py-8">
      <div className="mx-auto mb-3 max-w-6xl px-4">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Everything your employees need — in one command center
        </p>
      </div>
      <Marquee speed="normal" className="gap-12">
        {[...items, ...items, ...items].map((t, i) => (
          <span
            key={i}
            className="font-display whitespace-nowrap text-2xl font-bold text-foreground/25 transition-colors hover:text-primary md:text-3xl"
          >
            {t} <span className="mx-4 text-primary/40">✦</span>
          </span>
        ))}
      </Marquee>
    </section>
  );
}

export function Pillars() {
  const items = [
    { title: 'Docs → Answers', desc: 'Cited AI Chat from your knowledge base.', icon: BookOpen },
    { title: 'Apps → Home', desc: 'Live widgets from connected tools.', icon: Blocks },
    { title: 'Team → Workspace', desc: 'Isolated tenants, shared clarity.', icon: Users },
  ];
  return (
    <section data-tone="page" className="lp-section lp-section-y">
      <div className="mx-auto max-w-6xl px-4">
        <div className="max-w-3xl">
          <Kicker>Why Workhub</Kicker>
          <h2 data-reveal className="mt-3 text-4xl font-extrabold leading-[1] tracking-tight md:text-6xl">
            Stop hunting folders.
            <br />
            Stop hopping tabs.
            <br />
            <span className="text-gradient-brand">Start knowing.</span>
          </h2>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {items.map((it, i) => (
            <FeatureCard key={it.title} title={it.title} description={it.desc} icon={it.icon} delay={i + 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function Platform() {
  const items = [
    {
      n: '01',
      title: 'AI Chat with citations',
      desc: 'Ask in plain language. Every reply points back to the handbook, SOP, or policy you uploaded.',
      icon: MessageSquareText,
      href: '#ai-chat',
    },
    {
      n: '02',
      title: 'A living knowledge base',
      desc: 'Upload, preview, and manage documents so answers stay grounded in what leadership approved.',
      icon: BookOpen,
      href: '#knowledge',
    },
    {
      n: '03',
      title: 'Integrations marketplace',
      desc: 'Google, Jira, Asana, Monday, ClickUp, Slack, Zoom, Outlook, Dropbox, Calendly, Workday, Trello.',
      icon: Plug,
      href: '#integrations',
    },
    {
      n: '04',
      title: 'Home you design',
      desc: 'Pin live widgets so your dashboard mirrors tasks, calendars, boards and files — not empty chrome.',
      icon: Home,
      href: '#home',
    },
  ];
  return (
    <section id="platform" data-tone="page" className="lp-section lp-section-y relative">
      <div className="mx-auto max-w-6xl px-4">
        <div className="max-w-3xl">
          <Kicker>Platform</Kicker>
          <h2 data-reveal className="mt-3 text-4xl font-extrabold leading-[1.02] tracking-tight md:text-6xl">
            Four systems.
            <br />
            <span className="text-gradient-brand">One employee experience.</span>
          </h2>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {items.map((it, i) => (
            <a
              key={it.n}
              href={it.href}
              data-reveal
              data-delay={(i % 2) + 1}
              className="lp-card group relative overflow-hidden rounded-3xl border border-border/60 bg-card p-8 shadow-card md:p-10"
              onClick={(e) => {
                e.preventDefault();
                scrollLandingTo(it.href);
              }}
            >
              <div aria-hidden className="lp-card-glow" />
              <div className="relative flex items-start justify-between gap-6">
                <span
                  className="font-display text-6xl font-extrabold text-transparent transition group-hover:[-webkit-text-stroke:1.5px_oklch(0.7_0.19_35_/_0.9)]"
                  style={{ WebkitTextStroke: '1.5px oklch(0.7 0.19 35 / 0.35)' }}
                >
                  {it.n}
                </span>
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <it.icon className="h-5 w-5" />
                </div>
              </div>
              <h3 className="relative mt-6 text-2xl font-bold">{it.title}</h3>
              <p className="relative mt-2 text-muted-foreground">{it.desc}</p>
              <div className="relative mt-6 flex -translate-x-2 items-center gap-1.5 text-sm font-semibold text-primary opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                Explore <ArrowRight className="h-4 w-4" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function ChatBubble({ side, children }: { side: 'left' | 'right'; children: React.ReactNode }) {
  const right = side === 'right';
  return (
    <div className={`flex ${right ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
          right
            ? 'rounded-tr-md bg-primary font-medium text-primary-foreground shadow-glow'
            : 'rounded-tl-md border border-white/5 bg-white/[0.06] text-white/90'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export function AIChatSection() {
  return (
    <section
      id="ai-chat"
      data-tone="ink"
      className="lp-section lp-section-y relative overflow-hidden"
      style={{ background: 'oklch(0.19 0.03 250)', color: 'oklch(0.96 0.01 82)' }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 mesh-bg opacity-40" />
        <SoftOrb className="left-10 top-10 h-64 w-64 opacity-70" color="brand" />
        <SoftOrb className="bottom-0 right-0 h-80 w-80 opacity-60" color="warm" />
      </div>
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 md:grid-cols-2">
        <div>
          <Kicker light>AI Chat</Kicker>
          <h2 data-reveal className="mt-3 text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">
            Ask once. Get the policy — <span className="text-gradient-brand">with proof.</span>
          </h2>
          <p data-reveal data-delay="1" className="mt-5 max-w-lg text-lg text-white/70">
            Employees type a question. Workhub answers from your uploaded documents and shows the
            citation so nobody digs through folders.
          </p>
          <ul className="mt-8 space-y-3 text-white/85">
            {[
              'Natural-language Q&A over company docs',
              'Source citations on every reply',
              'Built for handbooks, SOPs and guides',
            ].map((t, i) => (
              <li key={t} data-reveal data-delay={i + 1} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <div data-reveal data-delay="4" className="mt-9">
            <PrimaryCta href="/register">Try AI Chat</PrimaryCta>
          </div>
        </div>
        <div data-reveal className="relative">
          <div
            aria-hidden
            className="absolute -inset-6 rounded-3xl opacity-45"
            style={{
              background: 'radial-gradient(ellipse at center, oklch(0.7 0.19 35 / 0.4), transparent 70%)',
            }}
          />
          <div className="glass-dark relative rounded-3xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">AI Chat</div>
              <div className="flex items-center gap-1.5 text-[10px] text-white/50">
                <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.7_0.15_150)]" /> Live
              </div>
            </div>
            <div className="space-y-4">
              <ChatBubble side="right">How many PTO days?</ChatBubble>
              <ChatBubble side="left">
                <div className="mb-1 text-xs font-semibold text-primary">Workhub AI</div>
                Full-time employees receive <b>20 days</b> of paid vacation per year.
                <div className="mt-1 text-xs italic text-white/45">Source · Employee Handbook §3</div>
              </ChatBubble>
              <ChatBubble side="right">Where do I submit time-off?</ChatBubble>
              <ChatBubble side="left">
                <div className="mb-1 text-xs font-semibold text-primary">Workhub AI</div>
                <div>Submit in Workday Time Off, or ask your manager for team-specific flows.</div>
                <div className="mt-1 text-xs italic text-white/45">Source · Time Off SOP</div>
              </ChatBubble>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function KnowledgeSection() {
  const docs = [
    { type: 'PDF', title: 'Employee Handbook 2026', tag: 'HR' },
    { type: 'PDF', title: 'IT Security Policy', tag: 'IT' },
    { type: 'DOC', title: 'Onboarding Checklist', tag: 'People Ops' },
    { type: 'PDF', title: 'Expense Guidelines', tag: 'Finance' },
  ];
  return (
    <section id="knowledge" data-tone="page" className="lp-section lp-section-y">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 md:grid-cols-2">
        <div data-reveal className="relative order-2 md:order-1">
          <div
            aria-hidden
            className="absolute -inset-4 rounded-3xl opacity-50"
            style={{
              background: 'radial-gradient(ellipse at center, oklch(0.85 0.15 45 / 0.28), transparent 70%)',
            }}
          />
          <div className="relative rounded-3xl border border-border/60 bg-card p-6 shadow-card">
            <div className="mb-5 flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Documents
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative h-2 w-2 rounded-full bg-primary" />
                </span>
                Synced
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {docs.map((d, i) => (
                <Link
                  key={d.title}
                  href="/register"
                  data-reveal
                  data-delay={i + 1}
                  className="lp-card group relative overflow-hidden rounded-2xl border border-border/60 bg-surface p-4"
                >
                  <div aria-hidden className="lp-card-glow" />
                  <div className="relative flex items-center justify-between">
                    <span className="rounded-md bg-primary/10 px-2 py-1 text-[10px] font-bold tracking-wider text-primary">
                      {d.type}
                    </span>
                    <FileText className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
                  </div>
                  <div className="relative mt-4 text-sm font-semibold leading-snug">{d.title}</div>
                  <div className="relative mt-1 text-xs text-muted-foreground">{d.tag}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="order-1 md:order-2">
          <Kicker>Knowledge base</Kicker>
          <h2 data-reveal className="mt-3 text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">
            Your documents become the <span className="text-gradient-brand">system of record.</span>
          </h2>
          <p data-reveal data-delay="1" className="mt-5 max-w-lg text-lg text-muted-foreground">
            Upload, preview and manage policies in Documents. The knowledge base feeds AI Chat — so
            answers stay aligned with what leadership approved.
          </p>
          <div data-reveal data-delay="2" className="mt-8">
            <PrimaryCta href="/register">Upload your first docs</PrimaryCta>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Integrations() {
  return (
    <section id="integrations" data-tone="page" className="lp-section lp-section-y relative">
      <div className="mx-auto max-w-6xl px-4">
        <div className="max-w-3xl">
          <Kicker>Integrations</Kicker>
          <h2 data-reveal className="mt-3 text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">
            Connect the stack. <span className="text-gradient-brand">Surface it on Home.</span>
          </h2>
          <p data-reveal data-delay="1" className="mt-4 text-lg text-muted-foreground">
            Browse by category, connect with OAuth, set preferences and pin live widgets.
          </p>
        </div>

        <div className="relative mt-10 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
          <Marquee speed="slow" className="gap-3">
            {[...APPS, ...APPS].map((it, i) => (
              <Link
                key={`${it.id}-${i}`}
                href="/register"
                className="group flex items-center gap-2.5 rounded-full border border-border bg-surface px-3.5 py-2 shadow-card transition hover:border-primary/50 hover:shadow-glow"
              >
                <AppBrandIcon iconKey={it.iconKey} size="sm" />
                <span className="whitespace-nowrap text-sm font-semibold">{it.name}</span>
              </Link>
            ))}
          </Marquee>
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border border-border/60 bg-card shadow-card">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
            {APPS.map((it, i) => (
              <Link
                key={it.id}
                href="/register"
                className="group relative overflow-hidden border-b border-r border-border/60 p-6 transition-colors hover:bg-surface"
                data-reveal
                data-delay={(i % 4) + 1}
              >
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
                  style={{
                    background:
                      'radial-gradient(120px 80px at 50% 0%, oklch(0.78 0.16 45 / 0.22), transparent 70%)',
                  }}
                />
                <div className="relative transition-transform group-hover:scale-105">
                  <AppBrandIcon iconKey={it.iconKey} size="md" />
                </div>
                <div className="relative mt-3 text-sm font-semibold">{it.name}</div>
                <div className="relative text-xs text-muted-foreground">{it.categoryLabel}</div>
              </Link>
            ))}
          </div>
        </div>

        <div id="home" className="mt-16 grid gap-4 md:grid-cols-4">
          {[
            { app: 'Jira', head: '12 open', sub: 'Assigned to me', icon: Wrench },
            { app: 'Google', head: '4 events', sub: "Today's calendar", icon: Calendar },
            { app: 'Monday', head: 'Launch board', sub: '3 items due', icon: LayoutDashboard },
            { app: 'Slack', head: '#ops-alerts', sub: 'Latest messages', icon: Bell },
          ].map((w, i) => (
            <Link
              key={w.app}
              href="/register"
              data-reveal
              data-delay={i + 1}
              className="lp-card group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-card"
            >
              <div aria-hidden className="lp-card-glow" />
              <div className="relative flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {w.app}
                </span>
                <w.icon className="h-4 w-4 text-primary transition-transform group-hover:scale-110" />
              </div>
              <div className="relative mt-4 text-xl font-bold">{w.head}</div>
              <div className="relative text-sm text-muted-foreground">{w.sub}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorks({
  progressLineRef,
}: {
  progressLineRef: RefObject<HTMLDivElement | null>;
}) {
  const steps = [
    {
      n: '01',
      title: 'Create workspace',
      desc: 'Register, invite the team, keep each company isolated.',
      icon: Users,
      href: '/register',
    },
    {
      n: '02',
      title: 'Upload truth',
      desc: 'Drop handbooks and SOPs into Documents for grounded AI.',
      icon: BookOpen,
      href: '/register',
    },
    {
      n: '03',
      title: 'Connect & pin',
      desc: 'OAuth your apps, then arrange Home the way you work.',
      icon: Plug,
      href: '/register',
    },
  ];

  return (
    <section id="how-it-works" data-tone="page" className="lp-section lp-section-y relative">
      <div className="mx-auto max-w-6xl px-4">
        <div className="max-w-3xl">
          <Kicker>How it works</Kicker>
          <h2 data-reveal className="mt-3 text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">
            Live in minutes. <span className="text-gradient-brand">Useful by lunch.</span>
          </h2>
        </div>
        <div data-progress-wrap className="relative mt-16 grid gap-6 md:grid-cols-3">
          <div
            aria-hidden
            className="absolute left-[8%] right-[8%] top-[46px] hidden h-px bg-border/70 md:block"
          />
          <div
            ref={progressLineRef}
            aria-hidden
            className="absolute left-[8%] top-[46px] hidden h-px origin-left md:block"
            style={{
              width: '84%',
              transform: 'scaleX(0)',
              background: 'linear-gradient(90deg, oklch(0.7 0.19 35), oklch(0.78 0.16 45))',
            }}
          />
          {steps.map((s, i) => (
            <Link key={s.n} href={s.href} data-reveal data-delay={i + 1} className="relative block">
              <div className="relative z-10 mx-auto grid h-24 w-24 place-items-center rounded-full border border-border bg-card shadow-card">
                <div
                  className="grid h-16 w-16 place-items-center rounded-full text-primary-foreground shadow-glow"
                  style={{ background: 'var(--gradient-brand)' }}
                >
                  <s.icon className="h-6 w-6" />
                </div>
              </div>
              <div className="lp-card mt-6 rounded-2xl border border-border/60 bg-card p-6 text-center shadow-card">
                <div className="text-xs font-bold tracking-widest text-primary">{s.n}</div>
                <h3 className="mt-1 text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Testimonials() {
  const quotes = [
    {
      q: 'Repeat questions dropped by 60% in three weeks. Employees just ask Workhub now.',
      name: 'Amelia Chen',
      role: 'Head of People, Northwind',
    },
    {
      q: "One tab. Everything from Jira to the handbook. It's the only dashboard the team actually opens.",
      name: 'Marcus Reid',
      role: 'Director of IT, Halcyon',
    },
    {
      q: 'Citations changed the game. Legal trusts the answers because they can see the source.',
      name: 'Priya Natarajan',
      role: 'COO, Fieldwork Labs',
    },
    {
      q: 'Onboarding time dropped in half. New hires self-serve everything from day one.',
      name: 'Sara Ortega',
      role: 'People Partner, Vela',
    },
  ];
  return (
    <section data-tone="page" className="lp-section lp-section-y relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4">
        <div className="max-w-3xl">
          <Kicker>Loved by operators</Kicker>
          <h2 data-reveal className="mt-3 text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">
            Teams stop searching. <span className="text-gradient-brand">They start shipping.</span>
          </h2>
        </div>
      </div>

      <div className="mt-14">
        <Marquee speed="slow" pauseOnHover className="gap-5 px-4">
          {[...quotes, ...quotes].map((t, i) => (
            <figure
              key={i}
              className="lp-card relative w-[360px] shrink-0 rounded-3xl border border-border/60 bg-card p-8 shadow-card md:w-[440px]"
            >
              <Quote className="h-8 w-8 text-primary/40" />
              <blockquote className="mt-4 text-lg font-medium leading-snug">&ldquo;{t.q}&rdquo;</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span
                  className="grid h-10 w-10 place-items-center rounded-full font-bold text-primary-foreground shadow-glow"
                  style={{ background: 'var(--gradient-brand)' }}
                >
                  {t.name.charAt(0)}
                </span>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </Marquee>
      </div>
    </section>
  );
}

export function BuiltFor() {
  const items = [
    {
      title: 'People & HR',
      desc: 'Policy answers in seconds. Handbooks stay searchable.',
      icon: UserCog,
    },
    {
      title: 'IT & Ops',
      desc: 'Fewer repeat tickets. Employees self-serve from approved docs.',
      icon: ShieldCheck,
    },
    {
      title: 'Team leads',
      desc: 'Meetings, issues and boards in one command center.',
      icon: Video,
    },
  ];
  return (
    <section data-tone="page" className="lp-section lp-section-y">
      <div className="mx-auto max-w-6xl px-4">
        <div className="max-w-3xl">
          <Kicker>Built for</Kicker>
          <h2 data-reveal className="mt-3 text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">
            The teams that <span className="text-gradient-brand">keep the company moving.</span>
          </h2>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {items.map((it, i) => (
            <FeatureCard key={it.title} title={it.title} description={it.desc} icon={it.icon} delay={i + 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function CTA() {
  return (
    <section id="cta" data-tone="page" className="lp-section lp-section-y pb-24 md:pb-32">
      <div className="mx-auto max-w-6xl px-4">
        <div
          className="relative overflow-hidden rounded-[2rem] p-10 shadow-lift md:p-16"
          style={{
            background: 'linear-gradient(135deg, oklch(0.24 0.03 250), oklch(0.19 0.03 250))',
          }}
        >
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 mesh-bg opacity-35" />
            <SoftOrb className="-right-32 -top-32 h-80 w-80 opacity-70" color="brand" />
            <SoftOrb className="-bottom-40 -left-20 h-80 w-80 opacity-60" color="warm" />
            <div
              className="absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage: 'radial-gradient(oklch(1 0 0) 1px, transparent 1px)',
                backgroundSize: '22px 22px',
              }}
            />
          </div>
          <div className="relative max-w-2xl">
            <Kicker light>Get started</Kicker>
            <h2
              data-reveal
              className="mt-3 text-4xl font-extrabold leading-[1] tracking-tight text-white md:text-6xl"
            >
              Put Workhub in front of <span className="text-gradient-brand">your team.</span>
            </h2>
            <p data-reveal data-delay="1" className="mt-5 max-w-lg text-lg text-white/70">
              Create a workspace, upload your first docs, connect the apps you already use — and
              give every employee a clearer workday.
            </p>
            <div data-reveal data-delay="2" className="mt-9 flex flex-wrap gap-3">
              <PrimaryCta href="/register">Create your workspace</PrimaryCta>
              <SecondaryCta href="/login" dark>
                Sign in
              </SecondaryCta>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-border/60 py-10">
      <div className="mx-auto grid max-w-6xl items-center gap-4 px-4 md:grid-cols-[1fr_auto]">
        <div className="flex items-center gap-2.5">
          <WorkhubLogo size="sm" showText={false} />
          <span className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {appConfig.name} · {appConfig.tagline}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {[
            ['Platform', '#platform'],
            ['AI Chat', '#ai-chat'],
            ['Integrations', '#integrations'],
            ['How it works', '#how-it-works'],
          ].map(([label, href]) => (
            <a
              key={label}
              href={href}
              className="transition hover:text-foreground"
              onClick={(e) => {
                e.preventDefault();
                scrollLandingTo(href);
              }}
            >
              {label}
            </a>
          ))}
          <Link href="/login" className="transition hover:text-foreground">
            Sign in
          </Link>
          <Link href="/register" className="transition hover:text-foreground">
            Get started
          </Link>
        </div>
      </div>
    </footer>
  );
}
