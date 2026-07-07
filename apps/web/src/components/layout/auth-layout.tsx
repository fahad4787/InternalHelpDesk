import { ReactNode } from 'react';
import { WorkhubLogo } from '@/components/shared/workhub-logo';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

const HIGHLIGHTS = [
  'Jira, Slack, Calendar & HR in one view',
  'See what needs your attention today',
  'Connect apps you already use',
];

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <aside className="auth-panel-brand relative hidden w-full max-w-[520px] shrink-0 flex-col lg:flex xl:max-w-[560px]">
        <div className="relative flex min-h-screen flex-col px-10 py-10 xl:px-14 xl:py-12">
          <WorkhubLogo variant="sidebar" size="lg" />

          <div className="flex flex-1 flex-col justify-center py-10">
            <h2 className="font-heading text-[2rem] font-bold leading-tight text-white xl:text-[2.35rem]">
              Your work command center,
              <br />
              <span className="text-brand">unified across apps</span>
            </h2>
            <p className="mt-5 max-w-sm text-base leading-relaxed text-sidebar-muted">
              Connect Jira, Slack, Calendar, and HR tools. See what needs your attention
              and act from one place.
            </p>
            <ul className="mt-8 space-y-3" role="list">
              {HIGHLIGHTS.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-white/80">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-sidebar-muted">Secure employee experience platform</p>
        </div>
      </aside>

      <main className="flex min-h-screen flex-1 flex-col justify-center bg-canvas px-6 py-10 sm:px-10 lg:px-16 xl:px-20">
        <div className="mx-auto w-full max-w-[400px]">
          <div className="mb-8 lg:hidden">
            <WorkhubLogo size="md" />
          </div>

          <div className="rounded-2xl border border-border-warm bg-white p-8 shadow-sm sm:p-9">
            <h1 className="font-heading text-2xl font-bold text-ink">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
