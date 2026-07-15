'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import {
  DASHBOARD_WIDGET_DEFINITIONS,
  type DashboardWidgetId,
} from '@/constants/dashboard-widget-registry';
import { cn } from '@/lib/utils';
import { useDashboardVisibleWidgets } from '@/hooks/use-dashboard-visible-widgets';
import { useDashboardWidgetOrder } from '@/hooks/use-dashboard-widget-order';

const SOURCE_BADGE: Record<string, string> = {
  GOOGLE_CALENDAR: 'bg-sky-500/90 text-white',
  JIRA: 'bg-blue-500/90 text-white',
  TRELLO: 'bg-sky-700/90 text-white',
  ASANA: 'bg-brand/90 text-white',
  MONDAY: 'bg-rose-500/90 text-white',
  CALENDLY: 'bg-blue-600/90 text-white',
  SLACK: 'bg-purple-500/90 text-white',
  ZOOM: 'bg-blue-500/90 text-white',
  OUTLOOK: 'bg-sky-600/90 text-white',
  DROPBOX: 'bg-blue-600/90 text-white',
  WORKDAY: 'bg-orange-500/90 text-white',
};

function providerBadge(provider: string) {
  if (provider === 'GOOGLE_CALENDAR') return 'GOOGLE';
  if (provider === 'JIRA') return 'JIRA';
  if (provider === 'TRELLO') return 'TRELLO';
  if (provider === 'ASANA') return 'ASANA';
  if (provider === 'MONDAY') return 'MONDAY';
  if (provider === 'CALENDLY') return 'CAL';
  if (provider === 'SLACK') return 'SLACK';
  if (provider === 'ZOOM') return 'ZOOM';
  if (provider === 'OUTLOOK') return 'OUTLOOK';
  if (provider === 'DROPBOX') return 'DROP';
  if (provider === 'WORKDAY') return 'WORKDAY';
  return provider.slice(0, 4);
}

export function FocusBanner() {
  const { visibleWidgetIds } = useDashboardVisibleWidgets();
  const { orderedWidgetIds } = useDashboardWidgetOrder(visibleWidgetIds);

  const chips = useMemo(
    () =>
      orderedWidgetIds.slice(0, 4).map((widgetId: DashboardWidgetId) => {
        const definition = DASHBOARD_WIDGET_DEFINITIONS[widgetId];
        return {
          id: widgetId,
          source: providerBadge(definition.provider),
          label: definition.label,
          tone: definition.provider,
          href: definition.configureRoute,
        };
      }),
    [orderedWidgetIds],
  );

  const headline =
    chips.length === 0
      ? 'Connect your apps to see a merged focus for today.'
      : `You have ${chips.length} active dashboard widget${chips.length === 1 ? '' : 's'} across your connected apps.`;

  return (
    <section
      className="dashboard-focus-banner mb-6 rounded-2xl p-5 sm:p-6"
      aria-labelledby="dashboard-focus-headline"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
        Today&apos;s focus — merged across your apps
      </p>
      <h2
        id="dashboard-focus-headline"
        className="mt-2 max-w-3xl font-heading text-xl font-semibold leading-snug text-white sm:text-2xl lg:text-3xl"
      >
        {headline}
      </h2>
      {chips.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2" role="list">
          {chips.map((chip) => {
            const chipClass = cn(
              'group inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-2.5 py-1.5 text-xs text-white/90 transition-colors',
              'hover:border-white/20 hover:bg-white/12',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-[#16282e]',
            );

            const content = (
              <>
                <span
                  className={cn(
                    'shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-none tracking-wide',
                    SOURCE_BADGE[chip.tone] ?? 'bg-white/20 text-white',
                  )}
                >
                  {chip.source}
                </span>
                <span className="min-w-0 leading-snug">{chip.label}</span>
                {chip.href && (
                  <ChevronRight
                    className="h-3.5 w-3.5 shrink-0 text-white/40 transition-transform group-hover:translate-x-0.5 group-hover:text-white/70"
                    aria-hidden
                  />
                )}
              </>
            );

            return (
              <li key={chip.id}>
                {chip.href ? (
                  <Link href={chip.href} className={chipClass}>
                    {content}
                  </Link>
                ) : (
                  <span className={chipClass}>{content}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
