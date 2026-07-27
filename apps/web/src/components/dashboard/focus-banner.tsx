'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useMemo, useSyncExternalStore } from 'react';
import {
  DASHBOARD_WIDGET_DEFINITIONS,
  type DashboardWidgetId,
} from '@/constants/dashboard-widget-registry';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useDashboardVisibleWidgets } from '@/hooks/use-dashboard-visible-widgets';
import { useDashboardWidgetOrder } from '@/hooks/use-dashboard-widget-order';
import { formatDashboardDate } from '@/constants/dashboard-seed';

const SOURCE_BADGE: Record<string, string> = {
  GOOGLE_CALENDAR: 'bg-sky-500/90 text-white',
  JIRA: 'bg-blue-500/90 text-white',
  TRELLO: 'bg-sky-700/90 text-white',
  ASANA: 'bg-brand/90 text-white',
  MONDAY: 'bg-rose-500/90 text-white',
  CLICKUP: 'bg-violet-600/90 text-white',
  CALENDLY: 'bg-blue-600/90 text-white',
  SLACK: 'bg-purple-500/90 text-white',
  ZOOM: 'bg-blue-500/90 text-white',
  OUTLOOK: 'bg-sky-600/90 text-white',
  MICROSOFT_TEAMS: 'bg-indigo-600/90 text-white',
  DROPBOX: 'bg-blue-600/90 text-white',
  BOX: 'bg-blue-500/90 text-white',
  ONEDRIVE: 'bg-sky-500/90 text-white',
  SHAREPOINT: 'bg-teal-600/90 text-white',
  HUBSPOT: 'bg-orange-500/90 text-white',
  SALESFORCE: 'bg-sky-600/90 text-white',
  DYNAMICS_365: 'bg-blue-700/90 text-white',
  ZOHO_CRM: 'bg-red-500/90 text-white',
  ZOHO_PEOPLE: 'bg-red-600/90 text-white',
  WORKDAY: 'bg-orange-500/90 text-white',
};

const PROVIDER_LABEL: Record<string, string> = {
  GOOGLE_CALENDAR: 'Google',
  JIRA: 'Jira',
  TRELLO: 'Trello',
  ASANA: 'Asana',
  MONDAY: 'Monday.com',
  CLICKUP: 'ClickUp',
  CALENDLY: 'Calendly',
  SLACK: 'Slack',
  ZOOM: 'Zoom',
  OUTLOOK: 'Outlook',
  MICROSOFT_TEAMS: 'Teams',
  DROPBOX: 'Dropbox',
  BOX: 'Box',
  ONEDRIVE: 'OneDrive',
  SHAREPOINT: 'SharePoint',
  HUBSPOT: 'HubSpot',
  SALESFORCE: 'Salesforce',
  DYNAMICS_365: 'Dynamics 365',
  ZOHO_CRM: 'Zoho CRM',
  ZOHO_PEOPLE: 'Zoho People',
  WORKDAY: 'Workday',
};

function providerBadge(provider: string) {
  if (provider === 'GOOGLE_CALENDAR') return 'GOOGLE';
  if (provider === 'MICROSOFT_TEAMS') return 'TEAMS';
  if (provider === 'DYNAMICS_365') return 'D365';
  if (provider === 'ZOHO_CRM') return 'ZOHO';
  if (provider === 'ZOHO_PEOPLE') return 'PEOPLE';
  if (provider === 'CLICKUP') return 'CLICK';
  if (provider === 'CALENDLY') return 'CAL';
  if (provider === 'SHAREPOINT') return 'SP';
  if (provider === 'ONEDRIVE') return 'OD';
  if (provider === 'SALESFORCE') return 'SF';
  if (provider === 'HUBSPOT') return 'HUB';
  return provider.slice(0, 6);
}

function listPhrase(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function focusPeriodLabel(hour: number): string {
  if (hour < 12) return "This morning's focus";
  if (hour < 17) return "This afternoon's focus";
  return "This evening's focus";
}

function subscribeToNothing() {
  return () => undefined;
}

function getClientHour() {
  return new Date().getHours();
}

function getServerHour() {
  return 12;
}

interface FocusBannerProps {
  visibleWidgetIds?: DashboardWidgetId[];
  connectedCount?: number;
  isResolving?: boolean;
}

export function FocusBanner({
  visibleWidgetIds: visibleWidgetIdsProp,
  connectedCount: connectedCountProp,
  isResolving = false,
}: FocusBannerProps = {}) {
  const { user } = useAuth();
  const {
    visibleWidgetIds: hookWidgetIds,
    connectedCount: hookConnectedCount,
  } = useDashboardVisibleWidgets();
  const visibleWidgetIds = visibleWidgetIdsProp ?? hookWidgetIds;
  const connectedCount = connectedCountProp ?? hookConnectedCount;
  const { orderedWidgetIds } = useDashboardWidgetOrder(visibleWidgetIds);
  const hour = useSyncExternalStore(
    subscribeToNothing,
    getClientHour,
    getServerHour,
  );
  const firstName = user?.firstName ?? 'there';
  const todayLabel = formatDashboardDate();

  const { chips, headline, summary } = useMemo(() => {
    const chipItems = orderedWidgetIds.map((widgetId: DashboardWidgetId) => {
      const definition = DASHBOARD_WIDGET_DEFINITIONS[widgetId];
      return {
        id: widgetId,
        source: providerBadge(definition.provider),
        label: definition.label,
        tone: definition.provider,
        href: definition.configureRoute,
      };
    });

    const providers = [
      ...new Set(
        orderedWidgetIds.map(
          (widgetId) => DASHBOARD_WIDGET_DEFINITIONS[widgetId].provider,
        ),
      ),
    ];
    const providerNames = providers
      .map((provider) => PROVIDER_LABEL[provider] ?? provider)
      .slice(0, 4);
    const focusLabels = orderedWidgetIds
      .slice(0, 3)
      .map((widgetId) => DASHBOARD_WIDGET_DEFINITIONS[widgetId].label);

    if (orderedWidgetIds.length === 0) {
      if (isResolving) {
        return {
          chips: chipItems,
          headline: `${firstName}, loading your live board…`,
          summary: `${todayLabel} · Checking ${connectedCount || 'your'} connected app${connectedCount === 1 ? '' : 's'}`,
        };
      }
      if (connectedCount > 0) {
        return {
          chips: chipItems,
          headline: `${firstName}, ${connectedCount} app${connectedCount === 1 ? ' is' : 's are'} connected — pin widgets to focus.`,
          summary: `${todayLabel} · Open Integrations to turn on dashboard widgets`,
        };
      }
      return {
        chips: chipItems,
        headline: `${firstName}, connect your apps to build today's focus board.`,
        summary: `${todayLabel} · Pin widgets from Integrations to see live work here`,
      };
    }

    const headlineText =
      focusLabels.length > 0
        ? `${firstName}, ${listPhrase(focusLabels)} ${focusLabels.length === 1 ? 'is' : 'are'} live on your board.`
        : `${firstName}, your connected apps are ready on your dashboard.`;

    const appCount = Math.max(providers.length, connectedCount);
    const widgetCount = orderedWidgetIds.length;
    const summaryText = `${todayLabel} · ${appCount} connected app${appCount === 1 ? '' : 's'}${
      providerNames.length ? ` · ${listPhrase(providerNames)}` : ''
    } · ${widgetCount} live widget${widgetCount === 1 ? '' : 's'}`;

    return {
      chips: chipItems,
      headline: headlineText,
      summary: summaryText,
    };
  }, [orderedWidgetIds, firstName, todayLabel, connectedCount, isResolving]);

  return (
    <section
      className="dashboard-focus-banner mb-6 rounded-2xl p-5 sm:p-6"
      aria-labelledby="dashboard-focus-headline"
      aria-busy={isResolving || undefined}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
        {focusPeriodLabel(hour)} — merged across your apps
      </p>
      <h2
        id="dashboard-focus-headline"
        className="mt-2 max-w-3xl font-heading text-xl font-semibold leading-snug text-white sm:text-2xl lg:text-3xl"
      >
        {headline}
      </h2>
      <p className="mt-2 text-sm text-white/65">{summary}</p>
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
