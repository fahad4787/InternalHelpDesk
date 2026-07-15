'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkhubLogo } from '@/components/shared/workhub-logo';
import { appConfig } from '@/config/app.config';
import { MARKETPLACE_APPS } from '@/constants/dashboard-integrations';
import { ScrollEngine, useScrollEngine } from './scroll-engine';
import { CustomCursor } from './custom-cursor';
import { Reveal } from './reveal';
import { Magnetic } from './magnetic';
import { Tilt } from './tilt';
import { ChapterRail } from './chapter-rail';
import './landing.css';

const APPS = MARKETPLACE_APPS.filter((a) => a.available);

const PILLARS = [
  {
    n: '01',
    title: 'AI Chat with citations',
    copy: 'Ask in plain language. Every reply points back to the handbook, SOP, or policy you uploaded.',
  },
  {
    n: '02',
    title: 'A living knowledge base',
    copy: 'Upload, preview, and manage documents so answers stay grounded in what leadership approved.',
  },
  {
    n: '03',
    title: 'Integrations marketplace',
    copy: 'Google, Jira, Asana, Monday, ClickUp, Slack, Zoom, Outlook, Dropbox, Calendly, Workday, Trello.',
  },
  {
    n: '04',
    title: 'Home you design',
    copy: 'Pin live widgets so your dashboard mirrors tasks, calendars, boards, and files — not empty chrome.',
  },
] as const;

const STEPS = [
  { n: '01', title: 'Create workspace', copy: 'Register, invite the team, keep each company isolated.' },
  { n: '02', title: 'Upload truth', copy: 'Drop handbooks and SOPs into Documents for grounded AI.' },
  { n: '03', title: 'Connect & pin', copy: 'OAuth your apps, then arrange Home the way you work.' },
] as const;

const AUDIENCES = [
  { title: 'People & HR', copy: 'Policy answers in seconds. Handbooks stay searchable.' },
  { title: 'IT & Ops', copy: 'Fewer repeat tickets. Employees self-serve from approved docs.' },
  { title: 'Team leads', copy: 'Meetings, issues, and boards in one command center.' },
] as const;

function NavLink({ href, children }: { href: string; children: string }) {
  const { scrollTo } = useScrollEngine();
  return (
    <a
      href={href}
      data-cursor-hover="Go"
      onClick={(e) => {
        e.preventDefault();
        scrollTo(href);
      }}
    >
      {children}
    </a>
  );
}

function Progress() {
  return (
    <div className="lp-progress" aria-hidden>
      <div className="lp-progress-fill" />
    </div>
  );
}

function Marquee() {
  const names = APPS.map((a) => a.name);
  const row = [...names, ...names];
  return (
    <div className="lp-marquee" aria-hidden>
      <div className="lp-marquee-track">
        {row.map((name, i) => (
          <span key={`${name}-${i}`}>{name}</span>
        ))}
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <ScrollEngine>
      <div className="lp">
        <CustomCursor />
        <Progress />
        <ChapterRail />

        <header className="lp-nav">
          <div className="lp-nav-inner">
            <Link href="/" data-cursor-hover="Home">
              <WorkhubLogo size="md" />
            </Link>
            <nav className="lp-nav-links" aria-label="Primary">
              <NavLink href="#platform">Platform</NavLink>
              <NavLink href="#chat">AI Chat</NavLink>
              <NavLink href="#integrations">Integrations</NavLink>
              <NavLink href="#home">Home</NavLink>
            </nav>
            <div className="lp-nav-actions">
              <Link href="/login" data-cursor-hover="Enter">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Magnetic>
                <Link href="/register" data-cursor-hover="Start">
                  <Button size="sm" className="lp-btn-shine">
                    Get started
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </Magnetic>
            </div>
          </div>
        </header>

        {/* HERO */}
        <section className="lp-hero" data-cursor="Explore" data-chapter="hero">
          <div className="lp-hero-orb lp-hero-orb--a" data-parallax="-0.2" aria-hidden />
          <div className="lp-hero-orb lp-hero-orb--b" data-parallax="0.14" aria-hidden />
          <div className="lp-hero-orb lp-hero-orb--c" data-parallax="-0.08" aria-hidden />

          <div className="lp-hero-shell">
            <div className="lp-hero-copy">
              <p className="lp-eyebrow">Employee experience</p>
              <p className="lp-hero-brand font-heading" data-parallax="-0.06">
                <span className="lp-hero-accent">Workhub</span>
              </p>
              <h1 className="font-heading lp-hero-title" data-parallax="-0.03">
                The command center for how{' '}
                <span className="lp-hero-accent">work actually moves</span>
              </h1>
              <p className="lp-hero-lede">
                AI answers from your documents. Live widgets from the apps you already pay for.
                One workspace for employee experience.
              </p>
              <div className="lp-hero-cta">
                <Magnetic strength={0.32}>
                  <Link href="/register" data-cursor-hover="Start">
                    <Button size="lg" className="lp-btn-shine">
                      Start free
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </Magnetic>
                <Magnetic strength={0.22}>
                  <Link href="/login" data-cursor-hover="Enter">
                    <Button variant="outline" size="lg">
                      Sign in
                    </Button>
                  </Link>
                </Magnetic>
              </div>
            </div>

            <div className="lp-hero-stage" data-parallax="0.08">
              <Tilt className="lp-tilt-stage">
                <div className="lp-stage" aria-hidden>
                  <div className="lp-stage-bar">
                    <span /><span /><span />
                    <em>Workhub · Home</em>
                  </div>
                  <div className="lp-stage-grid">
                    <div className="lp-stage-card">
                      <small>Tasks</small>
                      <strong>Review onboarding guide</strong>
                      <strong className="is-done">Sync Monday board</strong>
                      <strong>Approve time-off</strong>
                    </div>
                    <div className="lp-stage-card">
                      <small>Today</small>
                      <strong>Standup · 9:30</strong>
                      <span>Google Meet</span>
                      <strong>Design review · 2:00</strong>
                      <span>Zoom</span>
                    </div>
                    <div className="lp-stage-card lp-stage-card--chat">
                      <small>AI Chat</small>
                      <div className="lp-bubble lp-bubble--user">Parental leave policy?</div>
                      <div className="lp-bubble lp-bubble--ai">
                        16 weeks for full-time employees.
                        <em>HR Handbook §4</em>
                      </div>
                    </div>
                  </div>
                </div>
              </Tilt>
            </div>
          </div>

          <div className="lp-scroll-hint" aria-hidden>
            <span>Scroll</span>
            <i />
          </div>
        </section>

        {/* KINETIC BAND */}
        <div className="lp-kinetic" aria-hidden>
          <div className="lp-kinetic-track" data-kinetic="0.18">
            <span>Knowledge</span>
            <span>AI Chat</span>
            <span>Integrations</span>
            <span>Dashboard</span>
            <span>Workspace</span>
            <span>Knowledge</span>
            <span>AI Chat</span>
            <span>Integrations</span>
            <span>Dashboard</span>
            <span>Workspace</span>
          </div>
        </div>

        {/* MANIFESTO */}
        <section className="lp-manifesto" data-cursor="Read" data-chapter="manifesto">
          <div className="lp-wrap">
            <Reveal>
              <p className="lp-eyebrow">Why Workhub</p>
              <h2 className="font-heading lp-manifesto-line" data-parallax="-0.04">
                <span className="lp-line-mask"><span>Stop hunting folders.</span></span>
                <span className="lp-line-mask"><span>Stop hopping tabs.</span></span>
                <span className="lp-line-mask"><span className="is-accent">Start knowing.</span></span>
              </h2>
            </Reveal>
            <div className="lp-outcomes">
              {[
                ['Docs → Answers', 'Cited AI Chat from your knowledge base'],
                ['Apps → Home', 'Live widgets from connected tools'],
                ['Team → Workspace', 'Isolated tenants, shared clarity'],
              ].map(([t, c], i) => (
                <Reveal key={t} delay={i * 80} as="article" className="lp-outcome">
                  <h3 className="font-heading">{t}</h3>
                  <p>{c}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* PLATFORM */}
        <section
          id="platform"
          className="lp-section lp-section--ink lp-cv"
          data-cursor="Platform"
          data-chapter="platform"
        >
          <div className="lp-wrap">
            <Reveal>
              <p className="lp-eyebrow lp-eyebrow--light">Platform</p>
              <h2 className="font-heading lp-h2 lp-h2--light">
                Four systems. One employee experience.
              </h2>
            </Reveal>
            <div className="lp-pillars">
              {PILLARS.map((p, i) => (
                <Reveal key={p.n} delay={i * 60} as="article" className="lp-pillar">
                  <span className="font-heading">{p.n}</span>
                  <h3 className="font-heading">{p.title}</h3>
                  <p>{p.copy}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* AI CHAT */}
        <section id="chat" className="lp-section lp-cv" data-cursor="Ask" data-chapter="chat">
          <div className="lp-wrap lp-split">
            <div>
              <Reveal>
                <p className="lp-eyebrow">AI Chat</p>
                <h2 className="font-heading lp-h2">
                  Ask once.
                  <br />
                  Get the policy — with proof.
                </h2>
                <p className="lp-lede">
                  Employees type a question. Workhub answers from your uploaded documents and
                  shows the citation so nobody digs through folders.
                </p>
              </Reveal>
              <Reveal delay={80}>
                <ul className="lp-list">
                  <li>Natural-language Q&amp;A over company docs</li>
                  <li>Source citations on every reply</li>
                  <li>Built for handbooks, SOPs, and guides</li>
                </ul>
              </Reveal>
            </div>
            <Reveal delay={100}>
              <Tilt>
                <div className="lp-panel" aria-hidden>
                  <div className="lp-panel-label">AI Chat</div>
                  <div className="lp-chat">
                    <div className="lp-bubble lp-bubble--user">How many PTO days?</div>
                    <div className="lp-bubble lp-bubble--ai">
                      <b>Workhub AI</b>
                      Full-time employees receive <strong>20 days</strong> of paid vacation per year.
                      <em>Source · Employee Handbook §3</em>
                    </div>
                    <div className="lp-bubble lp-bubble--user">Where do I submit time-off?</div>
                    <div className="lp-bubble lp-bubble--ai">
                      <b>Workhub AI</b>
                      Submit in Workday Time Off, or ask your manager for team-specific flows.
                      <em>Source · Time Off SOP</em>
                    </div>
                  </div>
                </div>
              </Tilt>
            </Reveal>
          </div>
        </section>

        {/* KNOWLEDGE */}
        <section
          id="knowledge"
          className="lp-section lp-section--soft lp-cv"
          data-cursor="Upload"
          data-chapter="knowledge"
        >
          <div className="lp-wrap lp-split lp-split--flip">
            <div>
              <Reveal>
                <p className="lp-eyebrow">Knowledge base</p>
                <h2 className="font-heading lp-h2">
                  Your documents become the system of record
                </h2>
                <p className="lp-lede">
                  Upload, preview, and manage policies in Documents. The knowledge base feeds AI
                  Chat — so answers stay aligned with what leadership approved.
                </p>
              </Reveal>
            </div>
            <Reveal delay={80} className="lp-docs" aria-hidden>
              {[
                ['PDF', 'Employee Handbook 2026', 'HR'],
                ['PDF', 'IT Security Policy', 'IT'],
                ['DOC', 'Onboarding Checklist', 'People Ops'],
                ['PDF', 'Expense Guidelines', 'Finance'],
              ].map(([ext, name, team]) => (
                <div key={name} className="lp-doc" data-cursor-hover="Open">
                  <span>{ext}</span>
                  <div>
                    <strong>{name}</strong>
                    <p>{team}</p>
                  </div>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        {/* INTEGRATIONS */}
        <section id="integrations" className="lp-section lp-cv" data-cursor="Connect" data-chapter="integrations">
          <div className="lp-wrap">
            <Reveal>
              <p className="lp-eyebrow">Integrations</p>
              <h2 className="font-heading lp-h2">Connect the stack. Surface it on Home.</h2>
              <p className="lp-lede">
                Browse by category, connect with OAuth, set preferences, and pin live widgets.
              </p>
            </Reveal>
          </div>
          <Marquee />
          <div className="lp-wrap">
            <div className="lp-wall">
              {APPS.map((app, i) => (
                <Reveal
                  key={app.id}
                  delay={(i % 4) * 40}
                  className="lp-wall-cell"
                  data-cursor-hover="Connect"
                >
                  <strong className="font-heading">{app.name}</strong>
                  <span>{app.categoryLabel}</span>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* HOME */}
        <section id="home" className="lp-section lp-section--ink lp-cv" data-cursor="Build" data-chapter="home">
          <div className="lp-wrap lp-split">
            <div>
              <Reveal>
                <p className="lp-eyebrow lp-eyebrow--light">Home dashboard</p>
                <h2 className="font-heading lp-h2 lp-h2--light">
                  One screen for the work already happening
                </h2>
                <p className="lp-lede lp-lede--light">
                  After you connect apps, Home becomes a living board — issues, calendars,
                  boards, files — arranged the way your team works.
                </p>
              </Reveal>
            </div>
            <Reveal delay={90} className="lp-tiles" aria-hidden>
              {[
                ['Jira', '12 open', 'Assigned to me'],
                ['Google', '4 events', "Today's calendar"],
                ['Monday', 'Launch board', '3 items due'],
                ['Slack', '#ops-alerts', 'Latest messages'],
              ].map(([a, b, c], i) => (
                <div key={a} className="lp-tile" data-parallax={i % 2 === 0 ? '-0.05' : '0.05'}>
                  <span>{a}</span>
                  <strong className="font-heading">{b}</strong>
                  <p>{c}</p>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        {/* HOW */}
        <section id="how" className="lp-section lp-cv" data-cursor="Path" data-chapter="how">
          <div className="lp-wrap">
            <Reveal>
              <p className="lp-eyebrow">How it works</p>
              <h2 className="font-heading lp-h2">Live in minutes. Useful by lunch.</h2>
            </Reveal>
            <div className="lp-steps">
              {STEPS.map((s, i) => (
                <Reveal key={s.n} delay={i * 90} as="article" className="lp-step">
                  <span className="font-heading">{s.n}</span>
                  <h3 className="font-heading">{s.title}</h3>
                  <p>{s.copy}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* AUDIENCES */}
        <section id="teams" className="lp-section lp-section--soft lp-cv" data-cursor="Teams">
          <div className="lp-wrap">
            <Reveal>
              <p className="lp-eyebrow">Built for</p>
              <h2 className="font-heading lp-h2">The teams that keep the company moving</h2>
            </Reveal>
            <div className="lp-audience">
              {AUDIENCES.map((a, i) => (
                <Reveal key={a.title} delay={i * 70} as="article" className="lp-audience-card">
                  <h3 className="font-heading">{a.title}</h3>
                  <p>{a.copy}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="lp-cta lp-cv" data-cursor="Start" data-chapter="cta">
          <div className="lp-cta-orb" data-parallax="-0.12" aria-hidden />
          <Reveal className="lp-cta-inner">
            <p className="lp-eyebrow lp-eyebrow--light">Get started</p>
            <h2 className="font-heading">
              Put <span className="lp-cta-accent">Workhub</span> in front of your team
            </h2>
            <p>
              Create a workspace, upload your first docs, connect the apps you already use —
              and give every employee a clearer workday.
            </p>
            <div className="lp-cta-actions">
              <Magnetic strength={0.34}>
                <Link href="/register" data-cursor-hover="Launch">
                  <Button size="lg" className="lp-btn-shine">
                    Create your workspace
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </Magnetic>
              <Magnetic strength={0.22}>
                <Link href="/login" data-cursor-hover="Enter">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  >
                    Sign in
                  </Button>
                </Link>
              </Magnetic>
            </div>
          </Reveal>
        </section>

        <footer className="lp-footer">
          <WorkhubLogo size="sm" />
          <nav aria-label="Footer">
            <a href="#platform" data-cursor-hover="Go">Platform</a>
            <a href="#integrations" data-cursor-hover="Go">Integrations</a>
            <Link href="/login" data-cursor-hover="Enter">Sign in</Link>
            <Link href="/register" data-cursor-hover="Start">Get started</Link>
          </nav>
          <p>
            &copy; 2026 {appConfig.name}. {appConfig.tagline}.
          </p>
        </footer>
      </div>
    </ScrollEngine>
  );
}
