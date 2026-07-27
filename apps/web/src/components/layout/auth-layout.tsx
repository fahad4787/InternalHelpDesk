import { ReactNode } from 'react';
import { WorkhubLogo } from '@/components/shared/workhub-logo';
import { AuthPanelSlider } from '@/components/auth/auth-panel-slider';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <aside className="auth-panel-brand relative hidden w-full max-w-[520px] shrink-0 flex-col lg:flex xl:max-w-[560px]">
        <div className="relative flex min-h-screen flex-col px-10 py-10 xl:px-14 xl:py-12">
          <WorkhubLogo variant="sidebar" size="lg" />
          <AuthPanelSlider />
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
