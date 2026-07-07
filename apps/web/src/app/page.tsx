import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Bot,
  Brain,
  CheckCircle2,
  MessageSquare,
  Plug,
  Shield,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkhubLogo } from '@/components/shared/workhub-logo';
import { appConfig } from '@/config/app.config';

const features = [
  {
    icon: Brain,
    title: 'AI Knowledge Search',
    description: 'Upload policies, guides, and SOPs. AI instantly finds the right answers.',
    gradient: 'from-brand to-brand-accent',
  },
  {
    icon: MessageSquare,
    title: 'Intelligent Chat',
    description: 'Natural language Q&A with source citations from your documents.',
    gradient: 'from-emerald-600 to-teal-600',
  },
  {
    icon: Plug,
    title: 'Workday Integration',
    description: 'Sync help articles and SOPs from Workday into your knowledge base.',
    gradient: 'from-green-700 to-brand',
  },
  {
    icon: Shield,
    title: 'Multi-Tenant SaaS',
    description: 'Isolated workspaces with role-based access for every company.',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    icon: Zap,
    title: 'Integrations Ready',
    description: 'Slack, Teams, Google Drive, ServiceNow — and more.',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    icon: BookOpen,
    title: 'Document Management',
    description: 'Upload, preview, and manage company policies and guides.',
    gradient: 'from-teal-600 to-brand-accent',
  },
];

const highlights = [
  'Answers from your own documents',
  'Source citations on every reply',
  'Enterprise-grade security',
  'Setup in under 5 minutes',
];

export default function LandingPage() {
  return (
    <div className="ai-page-bg min-h-screen">
      <header className="sticky top-0 z-50 border-b border-border-warm bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/">
            <WorkhubLogo size="md" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden px-6 pb-20 pt-20">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-brand-light/40" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-muted bg-brand-light px-4 py-1.5 text-sm font-medium text-brand">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Internal Support
          </div>
          <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-6xl lg:text-7xl">
            Your company knowledge,{' '}
            <span className="ai-gradient-text">answered by AI</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            Upload internal docs, let employees ask questions through an intelligent
            chatbot, and route unresolved issues to the right team — all in one platform.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button size="lg">
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">Sign In</Button>
            </Link>
          </div>
          <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {highlights.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-muted">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-brand" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto mt-16 max-w-2xl">
          <div className="rounded-2xl border border-border-warm bg-white p-1 shadow-xl shadow-slate-200/50">
            <div className="rounded-xl bg-canvas p-5">
              <div className="mb-4 flex items-center gap-2 border-b border-border-warm pb-3">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="ml-2 text-xs font-medium text-muted">AI Chat · Live Preview</span>
              </div>
              <div className="space-y-3">
                <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-brand px-4 py-3 text-sm text-white shadow-md shadow-brand/20">
                  How many vacation days do employees get?
                </div>
                <div className="max-w-[90%] rounded-2xl rounded-bl-sm border border-border-warm bg-white px-4 py-3 text-sm shadow-sm">
                  <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-brand-accent">
                    <Bot className="h-3.5 w-3.5" />
                    AI Assistant
                  </div>
                  <p className="text-ink">
                    Full-time employees receive{' '}
                    <strong className="text-ink">20 days</strong> of paid vacation per year.
                  </p>
                  <p className="mt-2 text-xs text-muted">📄 Source: Employee Handbook §3</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border-warm bg-white px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-ink sm:text-4xl">
              Built for <span className="ai-gradient-text">intelligent support</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted">
              Everything your team needs to deliver fast, accurate internal support
            </p>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-border-warm bg-white p-6 shadow-sm transition-all duration-300 hover:border-brand-muted hover:shadow-md"
              >
                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.gradient} shadow-md`}
                >
                  <f.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-base font-semibold text-ink">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border-warm px-6 py-24">
        <div className="mx-auto max-w-3xl rounded-3xl border border-brand-muted bg-gradient-to-br from-brand-light to-positive-light p-12 text-center shadow-sm">
          <h2 className="text-3xl font-bold text-ink">
            Ready to transform internal support?
          </h2>
          <p className="mt-3 text-muted">
            Get your AI helpdesk running in minutes. No credit card required.
          </p>
          <Link href="/register" className="mt-8 inline-block">
            <Button size="lg">
              Create Your Workspace
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border-warm bg-white py-8 text-center text-sm text-muted">
        &copy; {new Date().getFullYear()} {appConfig.name}. All rights reserved.
      </footer>
    </div>
  );
}
