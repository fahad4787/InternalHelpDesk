'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'home' as const, label: 'Home', href: '/dashboard' },
  { id: 'integrations' as const, label: 'Integrations', href: '/integrations' },
];

export function DashboardTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onDashboardIntegrations =
    pathname === '/dashboard' && searchParams.get('view') === 'integrations';

  const activeTab =
    pathname === '/integrations' || onDashboardIntegrations ? 'integrations' : 'home';

  return (
    <div
      className="mb-6 inline-flex rounded-xl border border-border-warm bg-canvas p-1"
      role="tablist"
      aria-label="Dashboard views"
    >
      {TABS.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          role="tab"
          aria-selected={activeTab === tab.id}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
            activeTab === tab.id
              ? 'bg-white text-ink shadow-sm'
              : 'text-muted hover:text-ink',
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
