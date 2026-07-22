'use client';

import { type RefObject } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Blocks,
  BookOpen,
  Check,
  FileText,
  Home,
  MessageSquareText,
  Plug,
  Quote,
  ShieldCheck,
  UserCog,
  Users,
  Video,
} from 'lucide-react';
import { appConfig } from '@/config/app.config';
import { MARKETPLACE_APPS } from '@/constants/dashboard-integrations';
import { WorkhubLogo } from '@/components/shared/workhub-logo';
import {
  IntegrationIcon,
  type IntegrationIconProvider,
  isIntegrationIconProvider,
} from '@/components/shared/integration-icon';
import {
  BrandText,
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
  return (
    <section data-tone="surface" className="lp-section relative border-y border-border/60 bg-surface/40 py-8">
      <div className="mx-auto mb-3 max-w-6xl px-4">
        <p className="text-balance text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Everything your employees need — in one command center
        </p>
      </div>
      <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
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
          <h2 data-reveal className="mt-3 text-4xl font-extrabold leading-[1] tracking-tight md:text-6xl max-md:text-3xl">
            Stop hunting folders.
            <br />
            Stop hopping tabs.
            <br />
            <BrandText text="Start knowing." />
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
          <h2 data-reveal className="mt-3 text-4xl font-extrabold leading-[1.02] tracking-tight md:text-6xl max-md:text-3xl">
            Four systems.
            <br />
            <BrandText text="One employee experience." />
          </h2>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {items.map((it, i) => (
            <a
              key={it.n}
              href={it.href}
              data-reveal
              data-delay={(i % 2) + 1}
              className="lp-card group relative overflow-hidden rounded-3xl border border-border/60 bg-card p-8 shadow-card md:p-10 max-sm:p-6"
              onClick={(e) => {
                e.preventDefault();
                scrollLandingTo(it.href);
              }}
            >
              <div aria-hidden className="lp-card-glow" />
              <div className="relative flex items-start justify-between gap-6">
                <span
                  className="font-display text-6xl font-extrabold text-transparent transition group-hover:[-webkit-text-stroke:1.5px_oklch(0.7_0.19_35_/_0.9)] max-sm:text-5xl"
                  style={{ WebkitTextStroke: '1.5px oklch(0.7 0.19 35 / 0.35)' }}
                >
                  {it.n}
                </span>
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <it.icon className="h-5 w-5" />
                </div>
              </div>
              <h3 className="relative mt-6 text-2xl font-bold max-sm:text-xl">{it.title}</h3>
              <p className="relative mt-2 text-muted-foreground">{it.desc}</p>
              <div className="relative mt-6 flex items-center gap-1.5 text-sm font-semibold text-primary transition-all duration-300 max-md:translate-x-0 max-md:opacity-100 md:-translate-x-2 md:opacity-0 md:group-hover:translate-x-0 md:group-hover:opacity-100">
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
        <SoftOrb className="left-10 top-10 h-72 w-72 max-sm:left-4 max-sm:top-6 max-sm:h-48 max-sm:w-48" color="brand" />
        <SoftOrb className="-bottom-8 -right-8 h-96 w-96 max-sm:h-64 max-sm:w-64" color="warm" />
      </div>
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-2 md:gap-14">
        <div>
          <Kicker light>AI Chat</Kicker>
          <h2 data-reveal className="mt-3 text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl max-md:text-3xl">
            Ask once. Get the policy — <BrandText text="with proof." />
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
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-2 md:gap-14">
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          <h2 data-reveal className="mt-3 text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl max-md:text-3xl">
            Your documents become the <BrandText text="system of record." />
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
          <h2 data-reveal className="mt-3 text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl max-md:text-3xl">
            Connect the stack. <BrandText text="Surface it on Home." />
          </h2>
          <p data-reveal data-delay="1" className="mt-4 text-lg text-muted-foreground">
            Browse by category, connect with OAuth, set preferences and pin live widgets.
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-3xl border border-border/60 bg-card shadow-card">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
            {APPS.map((it, i) => (
              <Link
                key={it.id}
                href="/register"
                className="group relative min-w-0 overflow-hidden border-b border-r border-border/60 p-4 transition-colors hover:bg-surface sm:p-6"
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
                <div className="relative mt-3 truncate text-sm font-semibold">{it.name}</div>
                <div className="relative truncate text-xs text-muted-foreground">{it.categoryLabel}</div>
              </Link>
            ))}
          </div>
        </div>

        <div id="home" className="mt-16 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {(
            [
              { app: 'Jira', head: '12 open', sub: 'Assigned to me', iconKey: 'JIRA' },
              { app: 'Zoom', head: '4 events', sub: "Today's calendar", iconKey: 'ZOOM' },
              { app: 'Salesforce', head: 'Launch board', sub: '3 items due', iconKey: 'SALESFORCE' },
              { app: 'Microsoft Outlook', head: '15 mails', sub: 'Unread messages', iconKey: 'OUTLOOK' },
              { app: 'Google Drive', head: '3 shared', sub: 'Recently shared with you', iconKey: 'GOOGLE_DRIVE' },
              { app: 'Workday', head: '2 pending', sub: 'Awaiting approval', iconKey: 'WORKDAY' },
            ] as const satisfies ReadonlyArray<{
              app: string;
              head: string;
              sub: string;
              iconKey: IntegrationIconProvider;
            }>
          ).map((w, i) => (
            <Link
              key={w.app}
              href="/register"
              data-reveal
              data-delay={i + 1}
              className="lp-card group relative min-w-0 overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-card"
            >
              <div aria-hidden className="lp-card-glow" />
              <div className="relative flex items-center justify-between gap-2">
                <span className="truncate text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {w.app}
                </span>
                <AppBrandIcon iconKey={w.iconKey} size="sm" />
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
          <h2 data-reveal className="mt-3 text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl max-md:text-3xl">
            Live in minutes. <BrandText text="Useful by lunch." />
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
          <h2 data-reveal className="mt-3 text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl max-md:text-3xl">
            Teams stop searching. <BrandText text="They start shipping." />
          </h2>
        </div>
      </div>

      <div className="mt-14">
        <Marquee speed="slow" pauseOnHover className="gap-5 px-4">
          {[...quotes, ...quotes].map((t, i) => (
            <figure
              key={i}
              className="lp-card relative w-[440px] shrink-0 rounded-3xl border border-border/60 bg-card p-8 shadow-card max-md:w-[min(360px,calc(100vw-2.5rem))] max-sm:p-6"
            >
              <Quote className="h-8 w-8 text-primary/40" />
              <blockquote className="mt-4 text-lg font-medium leading-snug">&ldquo;{t.q}&rdquo;</blockquote>
              <figcaption className="mt-6 flex min-w-0 items-center gap-3">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full font-bold text-primary-foreground shadow-glow"
                  style={{ background: 'var(--gradient-brand)' }}
                >
                  {t.name.charAt(0)}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{t.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{t.role}</div>
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
          <h2 data-reveal className="mt-3 text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl max-md:text-3xl">
            The teams that <BrandText text="keep the company moving." />
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
          className="relative overflow-hidden rounded-[2rem] p-10 shadow-lift md:p-16 max-sm:rounded-[1.5rem] max-sm:p-6"
          style={{
            background: 'linear-gradient(135deg, oklch(0.24 0.03 250), oklch(0.19 0.03 250))',
          }}
        >
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 mesh-bg opacity-35" />
            <SoftOrb className="-right-24 -top-24 h-[28rem] w-[28rem] max-sm:-right-16 max-sm:-top-16 max-sm:h-64 max-sm:w-64" color="brand" />
            <SoftOrb className="-bottom-32 -left-16 h-[26rem] w-[26rem] max-sm:-bottom-20 max-sm:-left-10 max-sm:h-60 max-sm:w-60" color="warm" />
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
              className="mt-3 text-4xl font-extrabold leading-[1] tracking-tight text-white md:text-6xl max-md:text-3xl"
            >
              Put Workhub in front of <BrandText text="your team." />
            </h2>
            <p data-reveal data-delay="1" className="mt-5 max-w-lg text-lg text-white/70">
              Create a workspace, upload your first docs, connect the apps you already use — and
              give every employee a clearer workday.
            </p>
            <div
              data-reveal
              data-delay="2"
              className="mt-9 flex flex-wrap gap-3 max-sm:flex-col max-sm:items-stretch"
            >
              <PrimaryCta href="/register" className="max-sm:justify-center">
                Create your workspace
              </PrimaryCta>
              <SecondaryCta href="/login" dark className="max-sm:justify-center">
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
      <div className="mx-auto grid max-w-6xl items-center gap-4 px-4 md:grid-cols-[1fr_auto] max-md:flex max-md:flex-col max-md:items-start">
        <div className="flex min-w-0 items-center gap-2.5">
          <WorkhubLogo size="sm" showText={false} />
          <span className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {appConfig.name}
            <span className="max-sm:hidden"> · {appConfig.tagline}</span>
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
