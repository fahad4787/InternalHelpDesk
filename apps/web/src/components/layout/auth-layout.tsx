import { Bot, Sparkles } from 'lucide-react';
import { ReactNode } from 'react';
import { appConfig } from '@/config/app.config';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="relative hidden w-1/2 overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12 ai-page-bg">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-light/80 via-transparent to-emerald-100/50" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-accent shadow-lg shadow-brand/25">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900">{appConfig.name}</span>
        </div>
        <div className="relative">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-muted bg-brand-light px-4 py-1.5 text-sm text-brand">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Platform
          </div>
          <h2 className="text-4xl font-bold leading-tight text-slate-900">
            Your company knowledge,
            <br />
            <span className="ai-gradient-text">answered by AI</span>
          </h2>
          <p className="mt-4 max-w-md text-lg text-slate-600">
            Upload documents, chat with an intelligent assistant, and route
            unresolved questions to the right team.
          </p>
        </div>
        <p className="relative text-sm text-slate-500">Secure multi-tenant SaaS platform</p>
      </div>
      <div className="flex w-full flex-col justify-center bg-slate-50 px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
            <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-slate-600">{subtitle}</p>}
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
